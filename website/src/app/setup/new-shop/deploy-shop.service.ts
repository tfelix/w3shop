import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject, EMPTY, Observable, of } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import { ShopError, NetworkService, ShopIdentifierService } from 'src/app/core';
import { Progress, ShopConfigV1 } from 'src/app/shared';
import { ShopDeployStateService } from './shop-deploy-state.service';
import { NewShopData } from './new-shop-data';
import { Router } from '@angular/router';
import { ProgressStage, ProviderService, ShopFactoryContractService, UploadProgress, UploadService, UPLOAD_SERVICE_TOKEN } from 'src/app/blockchain';
import { generateShopAddress } from 'src/app/blockchain/generate-shop-address';
import { ethers } from 'ethers';

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
    private readonly providerService: ProviderService,
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
    const paymentProcessorIdx = 0;
    const salt = ethers.utils.keccak256(ethers.utils.randomBytes(32));

    this.setProgress(0, 'Creating Your Shop', null);

    this.providerService.address$.pipe(
      // Upload shop config to Arweave via Bundlr
      mergeMap(ownerAddr => this.uploadShopConfig(ownerAddr, newShop, salt)),
      tap(() => this.setProgress(75, 'Deploying Shop Contract', null)),
      mergeMap(arweaveId => this.deployContract(arweaveId, paymentProcessorIdx, salt)),
      tap((deployment) => this.setProgress(100, 'Shop created!', deployment.shopAddress)),
    ).subscribe(
      deployment => this.handleNewShopCreated(deployment),
      err => this.handleDeploymentError(err)
    );
  }

  private deployContract(arweaveId: string, paymentProcessorIndex: number, salt: string) {
    const arweaveUri = 'ar://' + arweaveId;

    return this.factoryContractService.deployShop(arweaveUri, paymentProcessorIndex, salt).pipe(
      map(shopAddress => ({ shopAddress, arweaveId }))
    );
  }

  private handleNewShopCreated(deployment: { shopAddress: string, arweaveId: string }) {
    this.deploymentStateService.clearShopDeploymentData();
    const identifier = this.identifierService.buildSmartContractIdentifier(deployment.shopAddress);

    console.info(`Deployed W3Shop (${deployment.shopAddress}) with identifier: ${identifier}`);

    this.deploymentStateService.registerShopIdentifier(identifier);

    // Goto the success page
    this.router.navigateByUrl('/setup/success');
  }

  private handleDeploymentError(err: any) {
    this.isDeploymentRunning = false;
    this.progress.error(err);
  }

  private uploadShopConfig(
    ownerAddress: string,
    newShop: NewShopData,
    salt: string
  ): Observable<string> {
    const network = this.networkService.getExpectedNetwork();

    // TODO for now we only have one payment processor anyways, later you possibly want to have this selectable.
    const paymentProcessorAddr = this.networkService.getExpectedNetwork().paymentProcessors[0].address;

    const shopAddress = generateShopAddress(
      network.shopFactoryContract,
      ownerAddress,
      paymentProcessorAddr,
      network.shopItemsContract,
      salt
    );

    const shopConfig = this.createShopConfig(newShop, shopAddress);
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

  private createShopConfig(
    newShop: NewShopData,
    shopAddress: string,
  ): ShopConfigV1 {

    return {
      shopName: newShop.shopName,
      shortDescription: newShop.shortDescription,
      description: newShop.description,
      keywords: newShop.keywords,
      currency: '0x0',
      contract: {
        address: shopAddress,
        chainId: 1
      },
      items: {},
      version: '1'
    };
  }
}