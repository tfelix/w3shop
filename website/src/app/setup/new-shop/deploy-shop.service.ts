import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, EMPTY, Observable, of } from 'rxjs';
import { map, mergeMap, shareReplay, tap } from 'rxjs/operators';
import { ShopError, NetworkService, ShopIdentifierService } from 'src/app/core';
import { filterNotNull, Progress, ShopConfigV1 } from 'src/app/shared';
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
    // For now disabled until we can customize it properly for every shop (not that OS somehow thinks those NFTs are fakes)
    // private readonly openSeaMetadataDeployer: OpenSeaMetadataDeployerService,
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
    const network = this.networkService.getExpectedNetwork();

    const shopAddress$ = this.providerService.address$.pipe(
      map(ownerAddress => generateShopAddress(
        network.shopFactoryContract,
        ownerAddress,
        salt
      )),
      shareReplay(1),
    );

    const shopIdentifier$ = shopAddress$.pipe(
      map(shopAddress => this.identifierService.buildSmartContractIdentifier(shopAddress))
    );

    this.setProgress(0, 'Creating Your Shop', null);

    shopAddress$.pipe(
      mergeMap(shopAddress => this.uploadShopConfig(shopAddress, newShop)),
      // Disabled until we can better customize OS.
      /*mergeMap(shopConfigUri => {
        return this.uploadContractUriConfig(
          shopIdentifier$,
          this.providerService.address$,
          newShop
        ).pipe(
          map(contractMetaUri => ({ contractMetaUri, shopConfigUri }))
        );
      }),*/
      tap(() => this.setProgress(75, 'Deploying Shop Contract', null)),
      mergeMap((shopConfigUri) => this.deployContract(
        newShop.shopName,
        shopConfigUri,
        // contractMetaUri, disabled for now and set to an empty string.
        '',
        paymentProcessorIdx,
        salt
      )),
    ).subscribe(
      _ => this.handleNewShopCreated(shopIdentifier$, shopAddress$),
      err => this.handleDeploymentError(err)
    );
  }

  private deployContract(
    shopName: string,
    shopConfigUri: string,
    contractMetaUri: string,
    paymentProcessorIndex: number,
    salt: string
  ): Observable<string> {
    return this.factoryContractService.deployShop(
      shopName,
      shopConfigUri,
      contractMetaUri,
      paymentProcessorIndex,
      salt
    );
  }

  private handleNewShopCreated(
    shopIdentifier$: Observable<string>,
    shopAddress$: Observable<string>
  ) {
    combineLatest([
      shopIdentifier$,
      shopAddress$
    ]).subscribe(([shopIdentifier, shopAddress]) => {
      this.setProgress(100, 'Shop created!', shopAddress);

      this.deploymentStateService.clearShopDeploymentData();

      console.info(`Deployed W3Shop (${shopAddress}) with identifier: ${shopIdentifier}`);

      this.deploymentStateService.registerShopIdentifier(shopIdentifier);

      // Goto the success page
      this.router.navigateByUrl('/setup/success');
    });
  }

  private handleDeploymentError(err: any) {
    this.isDeploymentRunning = false;
    this.progress.error(err);
  }

  private uploadShopConfig(
    shopAddress: string,
    newShop: NewShopData,
  ): Observable<string> {
    const shopConfig = this.createShopConfig(newShop, shopAddress);
    const dataSerialized = JSON.stringify(shopConfig);

    return this.uploadService.uploadJson(dataSerialized).pipe(
      tap(progress => this.publishUploadProgress(progress)),
      mergeMap(progress => {
        if (progress.fileId) {
          this.deploymentStateService.registerShopConfig(progress.fileId);
          return of(progress.fileId);
        } else {
          return EMPTY;
        }
      }),
      filterNotNull(),
      shareReplay(1)
    );
  }

  /* Diabled until OS config is handled better.
  private uploadContractUriConfig(
    identifier$: Observable<string>,
    ownerAddress$: Observable<string>,
    newShop: NewShopData,
  ): Observable<string> {
    return combineLatest([identifier$, ownerAddress$]).pipe(
      mergeMap(([shopIdentifier, ownerAddress]) => this.openSeaMetadataDeployer.deployMetadata(
        newShop,
        shopIdentifier,
        ownerAddress
      ))
    );
  }*/

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

    this.setProgress(normalizedProgress, text, null);
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