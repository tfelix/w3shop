import { WebBundlr } from '@bundlr-network/client';
import { forkJoin, from, Observable, of, ReplaySubject, Subject } from "rxjs";
import { catchError, delayWhen, map, mergeMap, shareReplay, take } from "rxjs/operators";

import { ShopError } from "src/app/core";
import { environment } from "src/environments/environment";
import { UploadProgress, ProgressStage, UploadService } from "./upload.service";
import { ethers } from "ethers";
import BigNumber from "bignumber.js";
import { ProviderService } from "../provider.service";

export class BundlrUploadService implements UploadService {

  private bundlr: Observable<WebBundlr>;

  constructor(
    private readonly providerService: ProviderService
  ) {
    this.bundlr = this.getBundlr();
  }

  deployFiles(data: string | Uint8Array): Observable<UploadProgress> {
    // It must be a replay subject because we already fill the observable before
    // the other angular components can subscribe to it.
    const sub = new ReplaySubject<UploadProgress>(1);

    from(this.bundlr).pipe(
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

  getCurrentBalance(): Observable<string> {
    return this.getBundlr().pipe(
      mergeMap(bundlr => bundlr.getLoadedBalance()),
      map(x => ethers.utils.formatEther(x.toString())),
      // Truncates to 6 digits
      map(x => (+x).toFixed(6)),
      shareReplay(1)
    );
  }

  bytesToUpload(): Observable<number> {
    const pricePerKByte$ = this.getBundlr().pipe(
      take(1),
      mergeMap(b => b.getPrice(1024))
    );

    const currentBalance$ = this.getBundlr().pipe(
      take(1),
      mergeMap(b => b.getLoadedBalance())
    );

    return forkJoin([pricePerKByte$, currentBalance$]).pipe(
      map(([pricePerKByte, currentBalance]) => {
        console.log('pricePerkB: ' + pricePerKByte);
        console.log('currentBalance: ' + currentBalance);

        const nPricePerKb = pricePerKByte.toNumber();
        const nCurBalance = currentBalance.toNumber();

        const possibleUploadKbyte = nCurBalance / (nPricePerKb / 1024);

        return possibleUploadKbyte;
      })
    );
  }

  fund(nBytes: number): Observable<void> {
    console.log(`Fund Bundlr for ${nBytes} bytes upload`);
    return this.getBundlr().pipe(
      take(1),
      mergeMap(bundlr => from(bundlr.getPrice(nBytes)).pipe(
        map(price => ({ bundlr, price }))
      )),
      mergeMap(({ bundlr, price }) => bundlr.fund(price)),
      mergeMap(_ => of(null)),
      catchError(err => {
        throw new ShopError('Could not fund the Bundlr Network', err);
      })
    );
  }

  private getBundlr(): Observable<WebBundlr> {
    if (this.bundlr) {
      return this.bundlr;
    } else {
      this.bundlr = this.providerService.provider$.pipe(
        map(p => {
          if (p === null) {
            throw new ShopError('No wallet connected');
          }

          if (environment.production) {
            return new WebBundlr('https://node1.bundlr.network', 'arbitrum', p);
          } else {
            return new WebBundlr('https://devnet.bundlr.network', 'arbitrum', p, { providerUrl: 'https://goerli-rollup.arbitrum.io/rpc/' });
          }
        }),
        delayWhen(b => from(b.ready())),
        shareReplay(1),
        catchError(err => {
          this.bundlr = null;
          throw new ShopError('Could not connect to the Bundlr Network', err);
        })
      );

      return this.bundlr;
    }
  }

  private async uploadData(bundlr: WebBundlr, sub: Subject<UploadProgress>, data: string | Uint8Array): Promise<string> {
    const balance = await bundlr.getLoadedBalance();

    const dataSerialized = JSON.stringify(data);
    const tx = bundlr.createTransaction(dataSerialized);

    const size = tx.size;
    const cost = await bundlr.getPrice(size);

    if (balance.isLessThan(cost)) {
      await this.fundBundlr(cost, balance, bundlr);
    }

    await tx.sign();
    const id = tx.id;
    await tx.upload();

    return id;
  }

  private async fundBundlr(cost: BigNumber, balance: BigNumber, bundlr: WebBundlr) {
    // Fund your account with the difference
    // We multiply by 1.1 to make sure we don't run out of funds
    const requiredFunds = cost.minus(balance).multipliedBy(1.1).integerValue();
    if (requiredFunds.isLessThanOrEqualTo(new BigNumber(0))) {
      throw new ShopError('There was an internal error while trying to fund the Bundlr network');
    }
    await bundlr.fund(requiredFunds);
  }
}