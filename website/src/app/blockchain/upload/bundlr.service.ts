import { Injectable } from "@angular/core";
import { WebBundlr } from "@bundlr-network/client";
import { forkJoin, from, Observable, of } from "rxjs";
import { catchError, delayWhen, map, mergeMap, shareReplay, take } from "rxjs/operators";

import { ProviderService } from "../provider.service";

import { ShopError } from "src/app/core";
import { environment } from "src/environments/environment";
import { ethers } from "ethers";

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

  /**
   * The current ETH balance of the Bundlr client.
   */
  getCurrentBalance(): Observable<string> {
    return this.getBundlr().pipe(
      mergeMap(bundlr => bundlr.getLoadedBalance()),
      map(x => ethers.utils.formatEther(x.toString())),
      // Truncates to 6 digits
      map(x => (+x).toFixed(6)),
      shareReplay(1)
    );
  }

  /**
   * Number of bytes that can be roughly uploaded with the current funding.
   */
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

  /**
   * Fund the Bundlr node so that its able to upload nBytes for the current prices.
   * @param nBytes
   */
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
}