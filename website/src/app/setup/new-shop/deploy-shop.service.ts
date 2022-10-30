import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject, EMPTY, Observable, of } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import { ShopError, NetworkService, ShopIdentifierService } from 'src/app/core';
import { Progress, ShopConfigV1 } from 'src/app/shared';
import { ShopDeployStateService } from './shop-deploy-state.service';
import { NewShopData } from './new-shop-data';
import { Router } from '@angular/router';
import { MockUploadService, ProgressStage, ShopFactoryContractService, UploadProgress, UploadService, UPLOAD_SERVICE_TOKEN } from 'src/app/blockchain';

export type DeployShopProgress = Progress<string>;

@Injectable({
  providedIn: 'root'
})
export class DeployShopService {

  private isDeploymentRunning = false;
  private progress = new BehaviorSubject<DeployShopProgress | null>(null);
  public readonly progress$ = this.progress.asObservable();

  constructor(
    private readonly factoryContractService: ShopFactoryContractService,
    private readonly deploymentStateService: ShopDeployStateService,
    private readonly networkService: NetworkService,
    private readonly identifierService: ShopIdentifierService,
    private readonly router: Router,
    @Inject(UPLOAD_SERVICE_TOKEN) private readonly uploadService: UploadService,
  ) {
  }

  private setProgress(
    progress: number,
    message: string,
    shopContractAddress: string | null
  ) {
    if (progress < 0 || progress > 100) {
      throw new Error('Progress must be between 0 and 100');
    }

    this.progress.next(
      {
        progress,
        result: shopContractAddress,
        text: message
      }
    );
  }

  deployShopContract(newShop: NewShopData): void {
    if (this.isDeploymentRunning) {
      throw new ShopError('A shop deployment is already in progress');
    }
    this.isDeploymentRunning = true;

    this.setProgress(0, 'Creating Your Shop', null);

    // Upload shop config to Arweave via Bundlr
    this.uploadShopConfig(newShop).pipe(
      tap(() => this.setProgress(75, 'Deploying Shop Contract', null)),
      mergeMap(arweaveId => this.deployContract(arweaveId)),
      tap((shopContractAddr) => this.setProgress(100, 'Shop created!', shopContractAddr)),
    ).subscribe(
      newShopAddr => this.handleNewShopCreated(newShopAddr),
      err => this.handleDeploymentError(err)
    );
  }

  private handleNewShopCreated(shopAddress: string) {
    this.deploymentStateService.clearShopDeploymentData();
    const identifier = this.identifierService.buildSmartContractIdentifier(shopAddress);

    console.info(`Deployed W3Shop (${shopAddress}) with identifier: ${identifier}`);

    this.deploymentStateService.registerShopIdentifier(identifier);

    // Goto the success page
    this.router.navigateByUrl('/setup/success');
  }

  private handleDeploymentError(err: any) {
    this.isDeploymentRunning = false;
    this.progress.error(err);
  }

  private uploadShopConfig(
    newShop: NewShopData,
  ): Observable<string> {
    // Try to recover from a possible partially successful deployment and potentially skip steps.
    /*const existingShopConfig = this.deploymentStateService.getShopConfig();
    if (existingShopConfig) {
      console.log('Found existing shop config, skipping upload');

      return of(existingShopConfig);
    } else {*/
    const shopConfig = this.createShopConfig(newShop);
    const dataSerialized = JSON.stringify(shopConfig);

    return this.uploadService.deployFiles(dataSerialized).pipe(
      tap(progress => this.publishUploadProgress(progress)),
      mergeMap(progress => {
        if (progress.fileId) {
          this.deploymentStateService.registerShopConfig(progress.fileId);
          return of(progress.fileId);
        } else {
          return EMPTY;
        }
      })
    );

    // }
  }

  private publishUploadProgress(progress: UploadProgress) {
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

    this.setProgress(normalizedProgress, text, null)
  }

  private deployContract(
    arweaveId: string,
  ): Observable<string> {
    // this.updateDeployResult(sub, { stage: 'Creating the Shop...', progress: 80 });
    // TODO we dont need to wait for the TX to succeed if we can just pre-generate the expected shop id.
    //  but we need to know the shops bytecode for the contract which we currently can not put easily into the
    //  code here. Later this might be improved.
    // UX: we can try to send an observable out that signals signature + wait time
    // TODO for now we only have one payment processor anyways, later you possibly want to have this selectable.
    const paymentProcessorAddr = this.networkService.getExpectedNetwork().paymentProcessors[0].address;
    return this.factoryContractService.deployShop(arweaveId, paymentProcessorAddr);
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
}