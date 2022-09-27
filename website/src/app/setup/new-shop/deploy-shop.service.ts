import { Inject, Injectable } from '@angular/core';
import { EMPTY, Observable, of, ReplaySubject, Subject } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { ShopContractService, ProgressStage, TOKEN_UPLOAD } from 'src/app/core';
import { ShopConfigV1 } from 'src/app/shared';
import { ShopDeployStateService } from './shop-deploy-state.service';
import { UploadProgress, UploadService } from 'src/app/core';
import { NewShopData } from './new-shop-data';

export interface ShopDeploy {
  contractAddress?: string;
  progress: number;
  stage: string;
}

@Injectable({
  providedIn: 'root'
})
export class DeployShopService {

  private currentDeployState: ShopDeploy;

  // As reference see https://github.com/dethcrypto/TypeChain/tree/master/examples/ethers-v5
  constructor(
    private readonly contractService: ShopContractService,
    private readonly deploymentStateService: ShopDeployStateService,
    @Inject(TOKEN_UPLOAD) private readonly uploadService: UploadService,
  ) {
  }

  deployShopContract(newShop: NewShopData): Observable<ShopDeploy> {
    this.currentDeployState = {
      progress: 0,
      stage: 'Starting Shop creation'
    };

    // It must be a replay subject because we already fill the observable before
    // the other angular components can subscribe to it.
    const sub = new ReplaySubject<ShopDeploy>(1);

    this.uploadShopConfig(newShop, sub).pipe(
      mergeMap(arweaveId => this.deployContract(arweaveId, sub)),
    ).subscribe(shopContractAddr => {
      console.log('Succesfully deployed shop contract to: ' + shopContractAddr);

      this.updateDeployResult(sub, { progress: 100, stage: 'Shop Contract deployed', contractAddress: shopContractAddr });
      sub.complete();

      this.deploymentStateService.clearShopConfig();
    }, err => {
      sub.error(err);
      sub.complete();
    });

    return sub.asObservable();
  }

  private uploadShopConfig(
    newShop: NewShopData,
    sub: Subject<ShopDeploy>
  ): Observable<string> {
    // Try to recover from a possible partially successful deployment and potentially skip steps.
    const existingShopConfig = this.deploymentStateService.getShopConfig();
    if (existingShopConfig) {
      console.log('Found existing shop config, skipping upload');

      return of(existingShopConfig);
    } else {
      const shopConfig = this.createShopConfig(newShop);
      const dataSerialized = JSON.stringify(shopConfig);

      return this.uploadService.deployFiles(dataSerialized).pipe(
        mergeMap(progress => {
          this.publishUploadProgress(progress, sub);
          if (progress.fileId) {
            this.deploymentStateService.registerShopConfig(progress.fileId);
            return of(progress.fileId);
          } else {
            return EMPTY;
          }
        })
      );
    }
  }

  private publishUploadProgress(progress: UploadProgress, sub: Subject<ShopDeploy>) {
    // Consider file upload to be 70 percent of the deployment process.
    const normalizedProgress = Math.round(progress.progress / 100.0 * 70);

    let text: string;
    switch (progress.stage) {
      case ProgressStage.SIGN_IN:
        text = 'Please sign into the Bundlr network with your wallet';
        break;
      case ProgressStage.FUND:
        text = 'Confirm funding to upload shop config';
        break;
      case ProgressStage.UPLOAD:
        text = 'Please sign shop config upload';
        break;
      case ProgressStage.COMPLETE:
        text = 'Shop config upload completed';
        break;
    }

    this.updateDeployResult(sub, { progress: normalizedProgress, stage: text });
  }

  private deployContract(
    arweaveId: string,
    sub: Subject<ShopDeploy>
  ): Observable<string> {
    this.updateDeployResult(sub, { stage: 'Creating the Shop...', progress: 80 });
    // TODO we dont need to wait for the TX to succeed if we can just pre-generate the expected shop id.
    //  but we need to know the shops bytecode for the contract which we currently can not put easily into the
    //  code here. Later this can be improved.
    // UX: we can try to send an observable out that signals signature + wait time
    return this.contractService.deployShop(arweaveId);
  }

  private createShopConfig(newShop: NewShopData): ShopConfigV1 {
    return {
      shopName: newShop.shopName,
      shortDescription: newShop.shortDescription,
      description: newShop.description,
      keywords: newShop.keywords,
      currency: 'ETH',
      items: {},
      version: '1'
    };
  }

  private updateDeployResult(sub: Subject<ShopDeploy>, result: Partial<ShopDeploy>) {
    const newResult = { ...this.currentDeployState, ...result };

    sub.next({
      progress: newResult.progress,
      stage: newResult.stage,
      contractAddress: newResult.contractAddress
    });

    this.currentDeployState = newResult;
  }
}