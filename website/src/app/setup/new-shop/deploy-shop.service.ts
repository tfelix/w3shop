import { Injectable } from '@angular/core';
import { WebBundlr } from '@bundlr-network/client';
import { from, Observable, of, ReplaySubject, Subject } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import BigNumber from 'bignumber.js';
import { ProviderService, ShopError, ShopContractService } from 'src/app/core';
import { ShopConfig, ShopConfigV1 } from 'src/app/shared';
import { environment } from 'src/environments/environment';
import { NewShop } from './new-shop';
import { Web3Provider } from '@ethersproject/providers';
import { ShopDeployStateService } from './shop-deploy-state.service';

interface DeployProgress {
  shopConfig?: string;
  contractAddress?: string;
  progress: number;
  stage: string;
}

export interface ShopDeploy {
  contractAddress?: string;
  progress: number;
  stage: string;
}

@Injectable({
  providedIn: 'root'
})
export class DeployShopService {

  private deployResult: DeployProgress = {
    progress: 0,
    stage: 'Starting Shop creation'
  }

  // As reference see https://github.com/dethcrypto/TypeChain/tree/master/examples/ethers-v5
  constructor(
    private readonly providerService: ProviderService,
    private readonly walletService: ShopContractService,
    private readonly deploymentStateService: ShopDeployStateService,
  ) {
  }

  deployShopContract(newShop: NewShop): Observable<ShopDeploy> {
    // It must be a replay subject because we already fill the observable before
    // the other angular components can subscribe to it.
    const sub = new ReplaySubject<ShopDeploy>(1);

    const provider = this.providerService.getProvider();
    if (provider === null) {
      throw new ShopError('No wallet connected');
    }

    // Try to recover from a possible partially successful deployment and potentially skip steps.
    const existingDeploymentState = this.deploymentStateService.getDeploymentState();
    const shopConfig = this.createShopConfig(newShop);

    // If the contract was already deployed we can short circuit.
    if (existingDeploymentState.shopContract) {
      this.deploymentStateService.clear();
      return of({
        progress: 100,
        stage: 'Shop was created',
        contractAddress: existingDeploymentState.shopContract
      });
    }

    // If the config upload is there, we can skip the bundlr part.
    let deployShopConfig: Observable<string>;
    if (existingDeploymentState.shopConfig) {
      console.log('Found existing shop config, skipping upload');
      deployShopConfig = of(existingDeploymentState.shopConfig);
    } else {
      deployShopConfig = from(this.getBundlr(sub, provider)).pipe(
        mergeMap(bundlr => this.uploadShopConfig(bundlr, sub, shopConfig))
      );
    }

    deployShopConfig.pipe(
      mergeMap(arweaveId => this.deployContract(arweaveId, sub)),
    ).subscribe(shopContractAddr => {
      this.updateDeployResult(sub, { progress: 100, stage: 'Shop Contract deployed', contractAddress: shopContractAddr });
      console.log('Succesfully deployed shop contract to: ' + shopContractAddr);
      sub.complete();
      this.deploymentStateService.clear();
    }, err => {
      sub.error(err);
      sub.complete();
    });

    return sub.asObservable();
  }

  private deployContract(
    arweaveId: string,
    sub: Subject<DeployProgress>
  ): Observable<string> {
    this.updateDeployResult(sub, { stage: 'Creating the Shop...', progress: 80 });

    // TODO we dont need to wait for the deployment if we can just pre-generate the expected shop id.
    return this.walletService.deployShop(arweaveId);
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

  private updateDeployResult(sub: Subject<ShopDeploy>, result: Partial<DeployProgress>) {
    console.info('Result was updated');

    const newResult = { ...this.deployResult, ...result };

    this.deploymentStateService.registerConfigDeployed(newResult.shopConfig);
    this.deploymentStateService.registerShopContractDeployed(newResult.contractAddress);

    sub.next({
      progress: newResult.progress,
      stage: newResult.stage,
      contractAddress: newResult.contractAddress
    });
    this.deployResult = newResult;
  }

  private async getBundlr(sub: Subject<DeployProgress>, provider: Web3Provider): Promise<WebBundlr> {
    this.updateDeployResult(sub, { stage: 'Logging into the Bundlr Network', progress: 0 });

    let bundlr: WebBundlr;
    if (environment.production) {
      bundlr = new WebBundlr('https://node1.bundlr.network', 'arbitrum', provider);
    } else {
      bundlr = new WebBundlr('https://devnet.bundlr.network', 'arbitrum', provider, { providerUrl: 'https://rinkeby.arbitrum.io/rpc' });
    }

    await bundlr.ready();

    return bundlr;
  }

  private async uploadShopConfig(bundlr: WebBundlr, sub: Subject<DeployProgress>, data: ShopConfig): Promise<string> {
    const balance = await bundlr.getLoadedBalance();
    console.debug('Deploying shop config', data);

    const dataSerialized = JSON.stringify(data);
    const tx = bundlr.createTransaction(dataSerialized);

    const size = tx.size;
    const cost = await bundlr.getPrice(size);

    if (balance.isLessThan(cost)) {
      await this.fundBundlr(cost, balance, bundlr, sub);
    }

    this.updateDeployResult(sub, { stage: 'Please sign the file upload transaction', progress: 20 });

    await tx.sign();
    const id = tx.id;

    this.updateDeployResult(sub, { stage: 'Uploading files...', progress: 30 });

    await tx.upload();

    this.updateDeployResult(sub, { stage: 'Shop configuration uploaded', progress: 50, shopConfig: id });

    return id;
  }

  private async fundBundlr(cost: BigNumber, balance: BigNumber, bundlr: WebBundlr, sub: Subject<DeployProgress>) {
    // Fund your account with the difference
    // We multiply by 1.1 to make sure we don't run out of funds
    const requiredFunds = cost.minus(balance).multipliedBy(1.1).integerValue();
    if (requiredFunds.isLessThanOrEqualTo(new BigNumber(0))) {
      throw new ShopError('There was an internal error while trying to fund the Bundlr network');
    }
    this.updateDeployResult(sub, { stage: 'Please fund Bundlr for file uploads. This can take a short while after signing.', progress: 10 });
    await bundlr.fund(requiredFunds);
  }
}