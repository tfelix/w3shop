import { Inject, Injectable } from '@angular/core';
import { EMPTY, Observable, of, ReplaySubject, Subject } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { ProviderService, ShopError, ShopContractService, ProgressStage, ChainIds } from 'src/app/core';
import { ShopConfigV1 } from 'src/app/shared';
import { NewShop } from './new-shop';
import { DeploymentState, ShopDeployStateService } from './shop-deploy-state.service';
import { Progress, UploadService } from 'src/app/core';
import { ShopIdentifierService } from 'src/app/core/shop/shop-identifier.service';

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
    private readonly providerService: ProviderService,
    private readonly contractService: ShopContractService,
    private readonly deploymentStateService: ShopDeployStateService,
    @Inject('Upload') private readonly uploadService: UploadService,
    private readonly shopIdentifierService: ShopIdentifierService
  ) {
  }

  deployShopContract(newShop: NewShop): Observable<ShopDeploy> {
    this.currentDeployState = {
      progress: 0,
      stage: 'Starting Shop creation'
    };

    // It must be a replay subject because we already fill the observable before
    // the other angular components can subscribe to it.
    const sub = new ReplaySubject<ShopDeploy>(1);

    // Try to recover from a possible partially successful deployment and potentially skip steps.
    const existingDeploymentState = this.deploymentStateService.getDeploymentState();

    // If the contract was already deployed we can short circuit.
    if (existingDeploymentState.shopContract) {
      this.deploymentStateService.clear();
      return of({
        progress: 100,
        stage: 'Shop was created',
        contractAddress: existingDeploymentState.shopContract
      });
    }

    this.uploadShopConfig(newShop, existingDeploymentState, sub).pipe(
      mergeMap(arweaveId => this.deployContract(arweaveId, sub)),
    ).subscribe(shopContractAddr => {
      this.updateDeployResult(sub, { progress: 100, stage: 'Shop Contract deployed', contractAddress: shopContractAddr });
      console.log('Succesfully deployed shop contract to: ' + shopContractAddr);
      // TODO make this configurable.
      const shopIdentifier = this.shopIdentifierService.buildSmartContractIdentifier(shopContractAddr, ChainIds.ARBITRUM_RINKEBY);
      this.deploymentStateService.registerShopContractDeployed(shopIdentifier);

      sub.complete();
      this.deploymentStateService.clear();
    }, err => {
      sub.error(err);
      sub.complete();
    });

    return sub.asObservable();
  }

  private uploadShopConfig(
    newShop: NewShop,
    existingDeploymentState: DeploymentState,
    sub: Subject<ShopDeploy>
  ): Observable<string> {
    if (existingDeploymentState.shopConfig) {
      console.log('Found existing shop config, skipping upload');
      return of(existingDeploymentState.shopConfig);
    } else {
      const shopConfig = this.createShopConfig(newShop);
      const dataSerialized = JSON.stringify(shopConfig);

      return this.uploadService.deployFiles(dataSerialized).pipe(
        mergeMap(progress => {
          this.publishUploadProgress(progress, sub);
          if (progress.fileId) {
            this.deploymentStateService.registerConfigDeployed(progress.fileId);
            return of(progress.fileId);
          } else {
            return EMPTY;
          }
        })
      );
    }
  }

  private publishUploadProgress(progress: Progress, sub: Subject<ShopDeploy>) {
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
    return this.contractService.deployShop(arweaveId);
  }

  private createShopConfig(newShop: NewShop): ShopConfigV1 {
    return {
      shopName: newShop.shopName,
      shortDescription: newShop.shortDescription,
      description: newShop.description,
      keywords: newShop.keywords,
      itemUris: [],
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