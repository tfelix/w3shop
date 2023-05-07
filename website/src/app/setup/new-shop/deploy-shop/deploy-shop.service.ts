import { Inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, mergeMap, share, shareReplay, take, tap } from 'rxjs/operators';
import { ethers } from 'ethers';

import { NetworkService, ShopError, ShopIdentifierService } from 'src/app/core';
import { DeployStepService, filterNotNull, ShopConfigV1, StepDescription, StepState } from 'src/app/shared';

import {
  generateShopAddress,
  ProviderService,
  ShopFactoryContractService,
} from 'src/app/blockchain';

import { UploadService, UPLOAD_SERVICE_TOKEN } from 'src/app/updload';

import { ShopDeployStateService } from '../shop-deploy-state.service';
import { NewShopData } from '../new-shop-data';
import { OpenSeaMetadataDeployerService } from './opensea-meta-deployer.service';

@Injectable({
  providedIn: 'root'
})
export class DeployShopService {

  private newShopData: NewShopData;

  constructor(
    private readonly factoryContractService: ShopFactoryContractService,
    private readonly deploymentStateService: ShopDeployStateService,
    private readonly networkService: NetworkService,
    private readonly identifierService: ShopIdentifierService,
    private readonly openSeaMetadataDeployer: OpenSeaMetadataDeployerService,
    private readonly providerService: ProviderService,
    private readonly router: Router,
    @Inject(UPLOAD_SERVICE_TOKEN) private readonly uploadService: UploadService,
    private readonly stepService: DeployStepService
  ) {
    this.stepService.executeStep$.subscribe(n => this.executeStep(n.idx));
    this.stepService.setSteps([]);
    this.requireCorrectNetwork();
  }

  deployShop(newShopData: NewShopData) {
    this.newShopData = newShopData;

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
        this.stepService.setStepExecution(n, this.hasEnoughBundlrFunds())
          .subscribe(
            (hasEnoughBundlrFunds) => {
              this.stepService.setStepState(0, StepState.SUCCESS);

              if (hasEnoughBundlrFunds) {
                this.stepService.setStepState(n + 1, StepState.SKIPPED);
                this.stepService.setStepState(n + 2, StepState.PENDING);
              } else {
                this.stepService.setStepState(1, StepState.PENDING);
              }
            },
            (err: ShopError) => this.stepService.setStepErrorMessage(n, err.message)
          );
        break;
      // Fund Bundlr
      case 1:
        // We fund for 5 MB.
        this.stepService.setStepExecution(n, this.uploadService.fund(5 * 1024 ** 2))
          .subscribe(
            () => {
              this.stepService.setStepState(n, StepState.SUCCESS);
              this.stepService.setStepState(n + 1, StepState.PENDING);
            },
            (err: ShopError) => this.stepService.setStepErrorMessage(n, err.message)
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
            (err: ShopError) => this.stepService.setStepErrorMessage(n, err.message)
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
            (err: ShopError) => this.stepService.setStepErrorMessage(n, err.message)
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
            (err: ShopError) => this.stepService.setStepErrorMessage(n, err.message)
          );
        break;
    }
  }

  /**
   * Checks that the users is on the right network.
   */
  private requireCorrectNetwork() {
    const network = this.networkService.getExpectedNetwork();

    this.providerService.chainId$.subscribe(chainId => {
      if (network.chainId !== chainId) {
        this.stepService.setDisabledReason(`Wrong network. Please connect to ${network.network}`);
      } else {
        this.stepService.setDisabledReason(null);
      }
    });
  }

  private hasEnoughBundlrFunds(): Observable<boolean> {
    /**
     * The strategy is that we require at least 2.5MB of uploadable data but request 5 if its less to be safe
     * against price swings in between and don't request new funds from the user.
     */
    return this.uploadService.getUploadableBytesCount().pipe(
      map((uploadableBundlrBytes) => {
        console.debug('uploadableBundlrBytes: ' + uploadableBundlrBytes);

        // We require a minimum of 2.5 MB, to be ready for some uploading without constant topping up.
        return uploadableBundlrBytes >= 2.5 * (1024 ** 2);
      })
    );
  }

  /**
   * Checks if there is saved data and it actually matches the currently connected wallet address.
   * If this is not the case, and depending on the progress the user has made we must clean throw
   * away some data because some depends on the wallet address.
   */
  private verifyWalletIsTheSame(connectedWalletAddress: string) {
    const shopDeployInfo = this.deploymentStateService.getShopDeploymentInfo();
    if (shopDeployInfo === null) {
      return;
    }

    if (shopDeployInfo.usedWalletAddress !== connectedWalletAddress) {
      console.warn(`Connected with wallet: ${connectedWalletAddress}, but existing deployment data was used with ${shopDeployInfo.usedWalletAddress}, purging progress`);
      this.deploymentStateService.clearMarketplaceConfigUri();
      this.deploymentStateService.clearShopDeploymentInfo();
    }
  }

  private uploadShopConfig(): Observable<string> {
    if (!this.newShopData) {
      throw new Error('Shop data was not available');
    }

    // The salt must be persisted so we can later pickup the generation.
    const salt = ethers.utils.keccak256(ethers.utils.randomBytes(32));
    const network = this.networkService.getExpectedNetwork();

    const connectedWalletAddress$ = this.providerService.address$.pipe(
      take(1),
      tap(x => this.verifyWalletIsTheSame(x)),
      share(),
    );

    return connectedWalletAddress$.pipe(
      mergeMap(usedWalletAddress => {
        const shopContractAddress = generateShopAddress(
          network.shopFactoryContract,
          usedWalletAddress,
          salt
        );

        const shopIdentifier = this.identifierService.buildSmartContractIdentifier(shopContractAddress);

        const shopConfig = this.createShopConfig(this.newShopData, shopContractAddress);
        const dataSerialized = JSON.stringify(shopConfig);

        return this.uploadService.uploadJson(dataSerialized).pipe(
          map(progress => progress.fileId),
          filterNotNull(),
          map(shopConfigUri => ({ shopConfigUri, salt, shopIdentifier, shopContractAddress, usedWalletAddress }))
        );
      }),
      tap(shopDeployInfo => {
        this.deploymentStateService.registerShopDeploymentInfo(shopDeployInfo);
      }),
      map(x => x.shopConfigUri),
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
    this.deploymentStateService.clearAllDeploymentData();

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