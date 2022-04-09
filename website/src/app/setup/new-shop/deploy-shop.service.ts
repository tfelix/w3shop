import { Injectable } from "@angular/core";
import { WebBundlr } from "@bundlr-network/client";
import { from, Observable, of, Subject } from "rxjs";
import { mergeMap } from "rxjs/operators";
import BigNumber from "bignumber.js";
import { ProviderService, ShopError } from "src/app/core";
import { ShopConfigV1 } from "src/app/shared";
import { environment } from "src/environments/environment";
import { NewShop } from "./new-shop";
import { Web3Provider } from "@ethersproject/providers";

export interface DeployResult {
  shopConfig?: string;
  contractAddress?: string;
  progress: number;
  stage: string;
}

function updateDeployResult(sub: Subject<DeployResult>, result: Partial<DeployResult>) {
  const newResult = { ...this.deployResult, ...result };
  sub.next(newResult);
  this.deployResult = newResult;
}

async function getBundlr(sub: Subject<DeployResult>, provider: Web3Provider): Promise<WebBundlr> {
  let bundlr: WebBundlr;
  if (environment.production) {
    bundlr = new WebBundlr("https://node1.bundlr.network", "arbitrum", provider);
  } else {
    bundlr = new WebBundlr("https://devnet.bundlr.network", "arbitrum", provider, { providerUrl: 'https://rinkeby.arbitrum.io/rpc' });
  }

  updateDeployResult(sub, { stage: 'Logging into the Bundlr Network', progress: 0 });

  await bundlr.ready();

  return bundlr;
}

async function uploadShopConfig(bundlr: WebBundlr, sub: Subject<DeployResult>, data: any): Promise<string> {
  const balance = await bundlr.getLoadedBalance();
  const dataSerialized = JSON.stringify(data);
  const tx = bundlr.createTransaction(dataSerialized);

  const size = tx.size;
  const cost = await bundlr.getPrice(size);

  if (balance.isLessThan(cost)) {
    // Fund your account with the difference
    // We multiply by 1.1 to make sure we don't run out of funds
    const requiredFunds = cost.minus(balance).multipliedBy(1.1).integerValue();
    if (requiredFunds.isLessThanOrEqualTo(new BigNumber(0))) {
      throw new ShopError('There was an internal error while trying to fund the Bundlr network');
    }
    updateDeployResult(sub, { stage: 'Please fund Bundlr in order to upload the files to Arweave', progress: 7 });
    await bundlr.fund(requiredFunds);
  }

  this.updateDeployResult(sub, { stage: 'Please sign the file upload transaction', progress: 10 });

  await tx.sign();
  const id = tx.id;

  updateDeployResult(sub, { stage: 'Uploading files...', progress: 25 });
  const result = await tx.upload();
  updateDeployResult(sub, { stage: 'Shop configuration uploaded', progress: 50 });

  console.info(result);

  return id;
}

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

  deployShopContract(newShop: NewShop): Observable<DeployResult> {
    const sub = new Subject<DeployResult>();

    const provider = this.providerService.getProvider();
    if (provider === null) {
      throw new ShopError('No wallet connected');
    }

    const shopConfig = this.createShopConfig(newShop);

    from(getBundlr(sub, provider)).pipe(
      mergeMap(bundlr => uploadShopConfig(bundlr, sub, shopConfig))
    )

    /*
    this.getBundlr(sub).pipe(
      mergeMap(bundlr => this.uploadShopConfig(newShop, bundlr, sub)),
      map(arweaveId => this.deployContract(arweaveId, sub))
    ).subscribe(contractAddr => {
      console.log('Succesfully deployed shop contract to: ' + contractAddr);
    }, error => {
      console.log(error);
      throw new ShopError('Deploying the shop failed. See console log for more information.');
    });*/

    return sub.asObservable();
  }

  private deployContract(
    arweaveId: string,
    sub: Subject<DeployResult>
  ): Observable<string> {
    console.debug('Deploying shop contract');

    sub.complete();
    return of('');
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
}