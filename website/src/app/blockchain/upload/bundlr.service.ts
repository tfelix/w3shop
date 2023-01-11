import { Injectable } from '@angular/core';
import { WebBundlr } from '@bundlr-network/client';
import { forkJoin, from, Observable } from 'rxjs';
import { catchError, delayWhen, map, mergeMap, share, shareReplay, take, tap } from 'rxjs/operators';
import BigNumber from 'bignumber.js';

import { ProviderService } from '../provider.service';

import { ShopError } from 'src/app/core';
import { environment } from 'src/environments/environment';
import { throwError } from 'rxjs/internal/observable/throwError';

@Injectable({
  providedIn: 'root'
})
export class BundlrService {
  private bundlr: Observable<WebBundlr>;

  constructor(
    private readonly providerService: ProviderService
  ) {
  }

  getBundlr(): Observable<WebBundlr> {
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
            return new WebBundlr('https://devnet.bundlr.network', 'arbitrum', p, { providerUrl: 'https://goerli-rollup.arbitrum.io/rpc' });
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

  withdraw(): Observable<any> {
    const curBalance$ = this.getBundlrBalance();

    return forkJoin([
      curBalance$,
      this.getBundlr().pipe(take(1))
    ]).pipe(
      mergeMap(([curBalance, bundlr]) => from(bundlr.withdrawBalance(curBalance))),
      tap(response => console.log('Funds withdrawn, response: ', response)),
      catchError(err => {
        console.log('Error withdrawing funds from Bundlr:', err);

        return throwError(new ShopError('Error while withdrawing funds from the Bundlr Network. For more details see the console logs.'));
      })
    );
  }

  /**
   * The current ETH balance of the Bundlr client.
   */
  getCurrentBalance(): Observable<string> {
    return this.getBundlrBalance().pipe(
      map(x => x.toString()),
      share()
    );
  }

  /**
   * Number of bytes that can be roughly uploaded with the current funding.
   */
  getUploadableBytesCount(): Observable<number> {
    // Check the price to upload 1MB of data
    // The function accepts a number of bytes, so to check the price of
    // 1MB, check the price of 1,048,576 bytes.
    const dataSizeToCheck = 1048576;
    const price1MBConverted$ = this.getBundlr().pipe(
      take(1),
      mergeMap(b => b.getPrice(dataSizeToCheck))
    );

    const currentBalance$ = this.getBundlrBalance();

    return forkJoin([price1MBConverted$, currentBalance$]).pipe(
      map(([pricePerMByte, currentBalance]) => {
        console.log('pricePerMB: ' + pricePerMByte);
        console.log('currentBalance: ' + currentBalance);

        return Math.floor(currentBalance.div(pricePerMByte).multipliedBy(dataSizeToCheck).toNumber());
      })
    );
  }

  /**
   * Fund the Bundlr node so that its able to upload nBytes for the current prices.
   *
   * Returns the funding TX id.
   *
   * @param nBytes
   */
  fund(nBytes: number): Observable<string> {
    console.log(`Fund Bundlr for ${nBytes} bytes (${Math.round(nBytes / 1048576)} MB) upload`);

    return this.getBundlr().pipe(
      take(1),
      mergeMap(bundlr => from(bundlr.getPrice(nBytes)).pipe(
        map(price => ({ bundlr, price }))
      )),
      mergeMap(({ bundlr, price: bytePrice }) => from(bundlr.fund(bytePrice))),
      map(t => t.id),
      catchError(err => this.handleError(err))
    );
  }

  private getBundlrBalance(): Observable<BigNumber> {
    return this.getBundlr().pipe(
      take(1),
      mergeMap(b => from(b.getLoadedBalance()))
    );
  }

  private handleError(err: any): never {
    if (err.code === 'INSUFFICIENT_FUNDS') {
      throw new ShopError('You dont have enough ETH to fund Bundlr.', err);
    }

    throw err;
  }
}