import { Injectable } from "@angular/core";
import { WebBundlr } from "@bundlr-network/client";
import BundlrTransaction from "@bundlr-network/client/build/common/transaction";
import { EMPTY, forkJoin, from, Observable, of, Subject } from "rxjs";
import { catchError, delayWhen, map, mergeMap, tap } from "rxjs/operators";
import BigNumber from "bignumber.js";
import { ProviderService, ShopError } from "src/app/core";
import { ShopConfigV1 } from "src/app/shared";
import { environment } from "src/environments/environment";
import { NewShop } from "./new-shop";
import { FundData } from "@bundlr-network/client/build/common/types";

export interface DeployResult {
  shopConfig?: string;
  contractAddress?: string;
  progress: number;
  stage: string;
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

  // Extract this into a storage service, that hides away the bundlr instance.
  private getBundlr(sub: Subject<DeployResult>): Observable<WebBundlr> {
    const provider = this.providerService.getProvider();
    if (provider === null) {
      throw new ShopError('No wallet connected');
    }

    let bundlr: WebBundlr;
    if (environment.production) {
      bundlr = new WebBundlr("https://node1.bundlr.network", "ethereum", provider);
    } else {
      bundlr = new WebBundlr("https://devnet.bundlr.network", "ethereum", provider, { providerUrl: 'https://rinkeby.arbitrum.io/rpc' });
    }

    return of(bundlr).pipe(
      tap(_ => this.updateDeployResult(sub, { stage: 'Logging into the Bundlr Network', progress: 0 })),
      delayWhen(() => from(bundlr.ready()))
    )
  }

  deployShopContract(newShop: NewShop): Observable<DeployResult> {
    const sub = new Subject<DeployResult>();

    this.getBundlr(sub).pipe(
      mergeMap(bundlr => this.uploadShopConfig(newShop, bundlr, sub)),
      map(arweaveId => this.deployContract(arweaveId, sub))
    ).subscribe(contractAddr => {
      console.log('Succesfully deployed shop contract to: ' + contractAddr);
    }, error => {
      console.log(error);
      throw new ShopError('Deploying the shop failed. See console log for more information.');
    });

    return sub.asObservable();
  }

  private uploadShopConfig(
    shop: NewShop,
    bundlr: WebBundlr,
    sub: Subject<DeployResult>
  ): Observable<string> {
    this.updateDeployResult(sub, { stage: 'Saving shop config on Arweave', progress: 5 });

    const tags = [{ name: "Content-Type", value: "text/plain" }];
    const data = JSON.stringify(this.createShopConfig(shop));
    const tx = bundlr.createTransaction(data);
    const size = tx.size;

    return forkJoin([
      from(bundlr.getPrice(size)),
      from(bundlr.getLoadedBalance())
    ]).pipe(
      mergeMap(([price, balance]) => {
        console.debug(`Funds on Bundlr: ${balance.toString()}, data upload cost: ${price.toString()}`);

        if (balance.isLessThan(price)) {
          return this.fundBundlr(bundlr, balance, price, sub).pipe(
            mergeMap(_ => this.performUpload(tx, sub))
          );
        } else {
          return this.performUpload(tx, sub);
        }
      }),
      tap(arweaveId => {
        this.updateDeployResult(sub, { stage: 'Uploaded Shop config successfull', shopConfig: arweaveId });
      })
    );
  }

  private fundBundlr(
    bundlr: WebBundlr,
    balance: BigNumber,
    price: BigNumber,
    sub: Subject<DeployResult>
  ): Observable<FundData | null> {
    this.updateDeployResult(sub, { stage: 'Please fund Bundlr in order to upload the files to Arweave', progress: 7 });
    // Fund your account with the difference
    // We multiply by 1.1 to make sure we don't run out of funds
    const requiredFunds = price.minus(balance).multipliedBy(1.1).integerValue();

    if (requiredFunds.isLessThanOrEqualTo(new BigNumber(0))) {
      throw new ShopError('There was an internal error while trying to fund the Bundlr network');
    }

    return from(bundlr.fund(requiredFunds)).pipe(
      tap(result => console.log(result))
    );
  }

  private performUpload(
    tx: BundlrTransaction,
    sub: Subject<DeployResult>
  ): Observable<string> {
    this.updateDeployResult(sub, { stage: 'Please sign the file upload transaction', progress: 10 });

    return from(tx.sign()).pipe(
      map(_ => {
        console.debug('Bundlr TX was signed');

        return tx.id;
      }),
      tap(_ => this.updateDeployResult(sub, { stage: 'Uploading files...', progress: 25 })),
      delayWhen(() => from(tx.upload())),
      tap(_ => this.updateDeployResult(sub, { stage: 'Shop configuration uploaded', progress: 50 })),
    );
  }

  private deployContract(
    arweaveId: string,
    sub: Subject<DeployResult>
  ): Observable<string> {
    console.debug('Deploying shop contract');

    sub.complete();
    return of('');
  }

  private updateDeployResult(sub: Subject<DeployResult>, result: Partial<DeployResult>) {
    const newResult = { ...this.deployResult, ...result };
    sub.next(newResult);
    this.deployResult = newResult;
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