import { Injectable } from "@angular/core";
import { WebBundlr } from "@bundlr-network/client";
import { from, Observable, ReplaySubject, Subject } from "rxjs";
import { mergeMap } from "rxjs/operators";
import BigNumber from 'bignumber.js';

import { ProviderService, ShopError } from "src/app/core";
import { environment } from "src/environments/environment";
import { Progress, ProgressStage, UploadService } from "./upload.service";

@Injectable({
  providedIn: 'root'
})
export class BundlrUploadService implements UploadService {

  constructor(
    private readonly providerService: ProviderService
  ) {
  }

  deployFiles(data: string): Observable<Progress> {
    // It must be a replay subject because we already fill the observable before
    // the other angular components can subscribe to it.
    const sub = new ReplaySubject<Progress>(1);

    from(this.getBundlr(sub)).pipe(
      mergeMap(bundlr => this.uploadData(bundlr, sub, data))
    ).subscribe(fileId => {
      sub.next({
        progress: 100,
        stage: ProgressStage.COMPLETE,
        fileId: fileId
      });
      sub.complete();
    }, err => {
      sub.error(err);
      sub.complete();
    });

    return sub.asObservable();
  }

  private async getBundlr(sub: Subject<Progress>): Promise<WebBundlr> {
    const provider = this.providerService.getProvider();
    if (provider === null) {
      throw new ShopError('No wallet connected');
    }

    let bundlr: WebBundlr;
    if (environment.production) {
      bundlr = new WebBundlr('https://node1.bundlr.network', 'arbitrum', provider);
    } else {
      bundlr = new WebBundlr('https://devnet.bundlr.network', 'arbitrum', provider, { providerUrl: 'https://rinkeby.arbitrum.io/rpc' });
    }

    await bundlr.ready();

    return bundlr;
  }

  private async uploadData(bundlr: WebBundlr, sub: Subject<Progress>, data: string): Promise<string> {
    const balance = await bundlr.getLoadedBalance();

    const dataSerialized = JSON.stringify(data);
    const tx = bundlr.createTransaction(dataSerialized);

    const size = tx.size;
    const cost = await bundlr.getPrice(size);

    if (balance.isLessThan(cost)) {
      await this.fundBundlr(cost, balance, bundlr, sub);
    }

    await tx.sign();
    const id = tx.id;
    await tx.upload();

    return id;
  }

  private async fundBundlr(cost: BigNumber, balance: BigNumber, bundlr: WebBundlr, sub: Subject<Progress>) {
    // Fund your account with the difference
    // We multiply by 1.1 to make sure we don't run out of funds
    const requiredFunds = cost.minus(balance).multipliedBy(1.1).integerValue();
    if (requiredFunds.isLessThanOrEqualTo(new BigNumber(0))) {
      throw new ShopError('There was an internal error while trying to fund the Bundlr network');
    }
    await bundlr.fund(requiredFunds);
  }
}