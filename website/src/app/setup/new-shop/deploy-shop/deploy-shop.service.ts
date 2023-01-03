import { Inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, Observable } from 'rxjs';
import { map, share, shareReplay, take, tap } from 'rxjs/operators';
import { ethers } from 'ethers';

import { NetworkService, ShopError, ShopIdentifierService } from 'src/app/core';
import { filterNotNull, ShopConfigV1 } from 'src/app/shared';

import {
  generateShopAddress,
  ProviderService,
  ShopFactoryContractService,
  UploadService,
  UPLOAD_SERVICE_TOKEN
} from 'src/app/blockchain';

import { ShopDeployStateService } from '../shop-deploy-state.service';
import { NewShopData } from '../new-shop-data';
import { OpenSeaMetadataDeployerService } from '../../opensea-meta-deployer.service';
import { BundlrService } from 'src/app/blockchain/upload/bundlr.service';
import { DeployStepService, StepDescription, StepState } from './deploy-steps/deploy-step.service';

@Injectable({
  providedIn: 'root'
})
export class DeployShopService {

  private bundlrBytesToFund: number;
  private newShopData: NewShopData;

  constructor(
    private readonly factoryContractService: ShopFactoryContractService,
    private readonly deploymentStateService: ShopDeployStateService,
    private readonly networkService: NetworkService,
    private readonly identifierService: ShopIdentifierService,
    private readonly openSeaMetadataDeployer: OpenSeaMetadataDeployerService,
    private readonly providerService: ProviderService,
    private readonly router: Router,
    private readonly bundlrService: BundlrService,
    @Inject(UPLOAD_SERVICE_TOKEN) private readonly uploadService: UploadService,
    private readonly stepService: DeployStepService
  ) {
    this.stepService.executeStep$.subscribe(n => this.executeStep(n));
    this.stepService.setSteps([]);
  }

  deployShop(newShopData: NewShopData) {
    this.newShopData = newShopData;

    this.bundlrBytesToFund = 0;

    this.prepareSteps();
  }

  private prepareSteps() {
    const steps: StepDescription[] = [
      {
        title: 'Check Bundlr Funds',
        buttonText: 'Check Funds',
        text: 'You need to upload some config files before the shop can be deployed. For this you might need a small deposit to use the Bundlr Network.',
        errorText: 'Checking the funds failed. You can retry this step without problems.'
      },
      {
        title: 'Fund Bundlr',
        buttonText: 'Fund Bundlr',
        text: 'In it was detected that your Bundlr funds are not enough. You need to charge it with a small amount of ETH to upload the required files.',
        errorText: 'Funding Bundlr failed. Maybe your balance is updated after some time. The following error was reported for debugging purposes:'
      },
      {
        title: 'Upload Shop Configuration',
        buttonText: 'Upload',
        text: 'You are now able to upload the shops main configuration file.',
      },
      {
        title: 'Upload Marketplace Configuration',
        buttonText: 'Upload',
        text: 'Marketplaces require a special configuration file in order to get basic information about your shop and the digital collectibles you sell.',
      },
      {
        title: 'Deploy Shop Contract',
        buttonText: 'Deploy',
        text: 'Almost there! You can not deploy your own shop contract.',
      }
    ];

    this.stepService.setSteps(steps);
  }

  private executeStep(n: number) {
    switch (n) {
      // Check Bundlr Fund
      case 0:
        this.stepService.setStepExecution(n, this.getRequiredFundBundlrBytes())
          .subscribe(
            (requiredBundlrBytes) => {
              this.stepService.setStepState(0, StepState.SUCCESS);

              if (requiredBundlrBytes === 0) {
                this.stepService.setStepState(n + 1, StepState.SKIPPED);
                this.stepService.setStepState(n + 2, StepState.PENDING);
              } else {
                this.bundlrBytesToFund = requiredBundlrBytes;
                this.stepService.setStepState(1, StepState.PENDING);
              }
            },
            (err: ShopError) => this.stepService.setStepErrorMessage(n, err.getCauseMessage())
          );
        break;
      // Fund Bundlr
      case 1:
        this.stepService.setStepExecution(n, this.bundlrService.fund(this.bundlrBytesToFund))
          .subscribe(
            () => {
              this.stepService.setStepState(n, StepState.SUCCESS);
              this.stepService.setStepState(n + 1, StepState.PENDING);
            },
            (err: ShopError) => this.stepService.setStepErrorMessage(n, err.getCauseMessage())
          );
        break;
      // Upload Shop Config
      case 2:
        this.stepService.setStepExecution(n, this.uploadShopConfig())
          .subscribe(
            () => {
              this.stepService.setStepState(n, StepState.SUCCESS);
              this.stepService.setStepState(n + 1, StepState.PENDING);
            },
            (err: ShopError) => this.stepService.setStepErrorMessage(n, err.getCauseMessage())
          );
        break;
      // Upload Marketplace Config
      case 3:
        this.stepService.setStepExecution(n, this.uploadMarketplaceConfig())
          .subscribe(
            () => {
              this.stepService.setStepState(n, StepState.SUCCESS);
              this.stepService.setStepState(n + 1, StepState.PENDING);
            },
            (err: ShopError) => this.stepService.setStepErrorMessage(n, err.getCauseMessage())
          );
        break;
      // Deploy Contract
      case 4:
        this.stepService.setStepExecution(n, this.deployShopContract())
          .subscribe(
            () => {
              this.stepService.setStepState(n, StepState.SUCCESS);

              this.handleNewShopCreated();
            },
            (err: ShopError) => this.stepService.setStepErrorMessage(n, err.getCauseMessage())
          );
        break;
    }
  }

  private getRequiredFundBundlrBytes(): Observable<number> {
    // The salt must be persisted so we can later pickup the generation.
    const salt = ethers.utils.keccak256(ethers.utils.randomBytes(32));
    const network = this.networkService.getExpectedNetwork();

    const connectedWalletAddress$ = this.providerService.address$.pipe(
      take(1),
      share()
    );

    const shopDeployInfo$ = connectedWalletAddress$.pipe(
      map(usedWalletAddress => {
        const shopContractAddress = generateShopAddress(
          network.shopFactoryContract,
          usedWalletAddress,
          salt
        );

        const shopIdentifier = this.identifierService.buildSmartContractIdentifier(shopContractAddress);

        return { salt, shopIdentifier, usedWalletAddress, shopContractAddress };
      }),
      tap(deployInfo => this.deploymentStateService.registerShopDeploymentInfo(deployInfo)),
      share()
    );

    const shopConfigByteSize$ = shopDeployInfo$.pipe(
      map(deployInfo => {
        const shopConfig = this.createShopConfig(this.newShopData, deployInfo.shopContractAddress);
        const shopConfigSerialized = JSON.stringify(shopConfig);

        return shopConfigSerialized.length;
      }),
      share()
    );

    const marketplaceConfigByteSize$ = forkJoin([
      connectedWalletAddress$,
      shopDeployInfo$
    ]).pipe(
      map(([connectedWalletAddress, shopDeployInfo]) => {
        return this.openSeaMetadataDeployer.getMetadataBytes(
          this.newShopData,
          shopDeployInfo.shopContractAddress,
          connectedWalletAddress
        );
      })
    );

    return forkJoin([
      shopConfigByteSize$,
      marketplaceConfigByteSize$,
      this.bundlrService.getUploadableBytesCount()
    ]).pipe(
      map(([shopConfigByteSize, marketplaceConfigByteSize, uploadableBundlrBytes]) => {
        const requiredTotalBytes = shopConfigByteSize + marketplaceConfigByteSize;
        // Use increments of 50 kb
        const requiredBundlrBytes = Math.ceil(requiredTotalBytes / 50) * 50;

        console.log('requiredBundlrBytes: ' + requiredBundlrBytes);
        console.log('uploadableBundlrBytes: ' + uploadableBundlrBytes);

        // We require a minimum of 5 MB, to be ready for some uploading without constant topping up.
        const miniumBytesRequired = Math.max(5 * 1024 ** 2, requiredBundlrBytes);

        return 0;
        /*
        if (uploadableBundlrBytes < miniumBytesRequired) {
          return miniumBytesRequired;
        } else {
          return 0;
        }*/
      })
    );
  }

  private uploadShopConfig(): Observable<string> {
    const shopInfo = this.deploymentStateService.getShopDeploymentInfo();
    if (!shopInfo) {
      throw new Error('No shop info was found');
    }

    if (!this.newShopData) {
      throw new Error('Shop data was not available');
    }

    const shopConfig = this.createShopConfig(this.newShopData, shopInfo.shopContractAddress);
    const dataSerialized = JSON.stringify(shopConfig);

    return this.uploadService.uploadJson(dataSerialized).pipe(
      map(progress => progress.fileId),
      filterNotNull(),
      tap(fileId => {
        shopInfo.shopConfigUri = fileId;
        this.deploymentStateService.registerShopDeploymentInfo(shopInfo);
      }),
      shareReplay(1)
    );
  }

  private deployShopContract(): Observable<any> {
    const shopInfo = this.deploymentStateService.getShopDeploymentInfo();
    if (!shopInfo) {
      throw new Error('No shop info was found');
    }

    if (!shopInfo.shopConfigUri) {
      throw new Error('No shop config URI was found');
    }

    const contractMetaUri = this.deploymentStateService.getMarketplaceConfigUri();
    if (!contractMetaUri) {
      throw new ShopError('No marketplace config URI was found');
    }

    return this.factoryContractService.deployShop(
      this.generateContractShopName(),
      shopInfo.shopConfigUri,
      contractMetaUri,
      // Currently there is only one payment processor. So we hardcode the idx to 0.
      0,
      shopInfo.salt
    );
  }

  private generateContractShopName(): string {
    const upperCaseName = this.newShopData.shopName.toLocaleUpperCase();
    const noWhiteSpace = upperCaseName.replace(/\s/g, '');

    return noWhiteSpace.slice(0, 8);
  }

  private uploadMarketplaceConfig(): Observable<string> {
    const shopInfo = this.deploymentStateService.getShopDeploymentInfo();
    if (!shopInfo) {
      throw new Error('No shop info was found');
    }

    return this.openSeaMetadataDeployer.deployMetadata(
      this.newShopData,
      shopInfo.shopIdentifier,
      shopInfo.usedWalletAddress
    ).pipe(
      tap(marketplaceConfigUri => this.deploymentStateService.registerMarketplaceConfigUri(marketplaceConfigUri))
    );
  }

  private handleNewShopCreated() {
    const shopInfo = this.deploymentStateService.getShopDeploymentInfo();
    this.deploymentStateService.clearShopDeploymentData();

    console.info(`Deployed W3Shop (${shopInfo.shopContractAddress}) with identifier: ${shopInfo.shopIdentifier}`);

    this.deploymentStateService.registerShopIdentifier(shopInfo.shopIdentifier);

    // Goto the success page
    this.router.navigateByUrl('/setup/success');
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