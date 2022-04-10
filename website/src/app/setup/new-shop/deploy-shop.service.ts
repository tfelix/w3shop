import { Injectable } from '@angular/core';
import { WebBundlr } from '@bundlr-network/client';
import { from, Observable, of, Subject } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import BigNumber from 'bignumber.js';
import { ProviderService, ShopError } from 'src/app/core';
import { ShopConfig, ShopConfigV1 } from 'src/app/shared';
import { environment } from 'src/environments/environment';
import { NewShop } from './new-shop';
import { Web3Provider } from '@ethersproject/providers';

export interface DeployResult {
  shopConfig?: string;
  contractAddress?: string;
  progress: number;
  stage: string;
}

// TODO Write a mock here in order to avoid real TX going out for local testing.
@Injectable({
  providedIn: 'root'
})
export class DeployShopService {

  private deployResult: DeployResult = {
    progress: 0,
    stage: 'Starting Shop creation'
  }

  // As reference see https://github.com/dethcrypto/TypeChain/tree/master/examples/ethers-v5
  constructor(
    private readonly providerService: ProviderService
  ) {
  }

  deployShopContract(newShop: NewShop, forceNewShop: boolean = false): Observable<DeployResult> {
    const sub = new Subject<DeployResult>();

    // TODO Try to recover from a possible partially successful deployment.

    const provider = this.providerService.getProvider();
    if (provider === null) {
      throw new ShopError('No wallet connected');
    }

    const shopConfig = this.createShopConfig(newShop);

    from(this.getBundlr(sub, provider)).pipe(
      mergeMap(bundlr => this.uploadShopConfig(bundlr, sub, shopConfig)),
      mergeMap(arweaveId => this.deployContract(arweaveId, sub)),
    ).subscribe(result => {
      console.log('Succesfully deployed shop contract to: ' + result);
    }, err => {
      sub.error(err);
      sub.complete();
    });
    return sub.asObservable();
  }

  private deployContract(
    arweaveId: string,
    sub: Subject<DeployResult>
  ): Observable<string> {
    this.updateDeployResult(sub, { stage: 'Creating the Shop...', progress: 80 });

    // Calculate the Shops expected ID, get the signature and finish the process.
    console.debug('Deploying shop contract');

    return of('ABC');
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

  private updateDeployResult(sub: Subject<DeployResult>, result: Partial<DeployResult>) {
    const newResult = { ...this.deployResult, ...result };
    localStorage.setItem(DeployShopService.DEPLOY_SHOP_PROGRESS, JSON.stringify(newResult));
    sub.next(newResult);
    this.deployResult = newResult;
  }

  private recoverDeployResult(): DeployResult | null {
    const data = localStorage.getItem(DeployShopService.DEPLOY_SHOP_PROGRESS);
    if (data === null) {
      return null;
    }

    return JSON.parse(data);
  }

  clearDeployResult() {
    localStorage.removeItem(DeployShopService.DEPLOY_SHOP_PROGRESS);
  }

  private async getBundlr(sub: Subject<DeployResult>, provider: Web3Provider): Promise<WebBundlr> {
    let bundlr: WebBundlr;
    if (environment.production) {
      bundlr = new WebBundlr('https://node1.bundlr.network', 'arbitrum', provider);
    } else {
      bundlr = new WebBundlr('https://devnet.bundlr.network', 'arbitrum', provider, { providerUrl: 'https://rinkeby.arbitrum.io/rpc' });
    }

    this.updateDeployResult(sub, { stage: 'Logging into the Bundlr Network', progress: 0 });

    await bundlr.ready();

    return bundlr;
  }

  private async uploadShopConfig(bundlr: WebBundlr, sub: Subject<DeployResult>, data: ShopConfig): Promise<string> {
    const balance = await bundlr.getLoadedBalance();
    console.debug('Deploying shop config', data);

    const dataSerialized = JSON.stringify(data);
    const tx = bundlr.createTransaction(dataSerialized);

    const size = tx.size;
    const cost = await bundlr.getPrice(size);

    if (balance.isLessThan(cost)) {
      await this.fundBundlr(cost, balance, bundlr, sub);
    }

    this.updateDeployResult(sub, { stage: 'Please sign the file upload transaction', progress: 10 });

    await tx.sign();
    const id = tx.id;

    this.updateDeployResult(sub, { stage: 'Uploading files...', progress: 25 });
    const result = await tx.upload();
    console.debug(result);
    this.updateDeployResult(sub, { stage: 'Shop configuration uploaded', progress: 50, shopConfig: id });

    return id;
  }

  private async fundBundlr(cost: BigNumber, balance: BigNumber, bundlr: WebBundlr, sub: Subject<DeployResult>) {
    // Fund your account with the difference
    // We multiply by 1.1 to make sure we don't run out of funds
    const requiredFunds = cost.minus(balance).multipliedBy(1.1).integerValue();
    if (requiredFunds.isLessThanOrEqualTo(new BigNumber(0))) {
      throw new ShopError('There was an internal error while trying to fund the Bundlr network');
    }
    this.updateDeployResult(sub, { stage: 'Please fund Bundlr in order to upload the files to Arweave', progress: 7 });
    await bundlr.fund(requiredFunds);
  }

  private static readonly DEPLOY_SHOP_PROGRESS = 'DEPLOY_SHOP_PROGRESS';
}