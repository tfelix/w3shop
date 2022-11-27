import { WebBundlr } from '@bundlr-network/client';
import { forkJoin, from, Observable, of, ReplaySubject, Subject } from "rxjs";
import { map, mergeMap, shareReplay, take } from "rxjs/operators";

import { ShopError } from "src/app/core";
import { UploadProgress, ProgressStage, UploadService } from "./upload.service";
import BigNumber from "bignumber.js";
import { BundlrService } from './bundlr.service';
import BundlrTransaction from '@bundlr-network/client/build/common/transaction';

export class BundlrUploadService implements UploadService {

  constructor(
    private readonly bundlrService: BundlrService
  ) {
  }

  uploadJson(data: string): Observable<UploadProgress> {
    // It must be a replay subject because we already fill the observable before
    // the other angular components can subscribe to it.
    const sub = new ReplaySubject<UploadProgress>(1);

    this.bundlrService.getBundlr().pipe(
      take(1),
      mergeMap(bundlr => this.makeTxFromJson(bundlr, data).pipe(map(tx => ({ tx, bundlr })))),
      mergeMap(({ tx, bundlr }) => this.executeTx(tx, bundlr))
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

  uploadFile(file: File): Observable<UploadProgress> {
    // It must be a replay subject because we already fill the observable before
    // the other angular components can subscribe to it.
    const sub = new ReplaySubject<UploadProgress>(1);

    this.bundlrService.getBundlr().pipe(
      take(1),
      mergeMap(bundlr => this.makeTxFromFile(bundlr, file).pipe(map(tx => ({ tx, bundlr })))),
      mergeMap(({ tx, bundlr }) => this.executeTx(tx, bundlr))
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

  private makeTxFromFile(
    bundlr: WebBundlr,
    file: File
  ): Observable<BundlrTransaction> {
    const tags = [
      { name: 'Content-Type', value: file.type }
    ];

    const buffer$ = from(file.arrayBuffer()).pipe(
      map(data => Buffer.from(data))
    );

    return buffer$.pipe(
      map(buffer => bundlr.createTransaction(buffer, { tags })),
      shareReplay(1)
    );
  }

  private makeTxFromJson(
    bundlr: WebBundlr,
    data: string
  ): Observable<BundlrTransaction> {
    const tags = [
      { name: 'Content-Type', value: 'application/json' }
    ];

    return of(bundlr.createTransaction(data, { tags })).pipe(
      shareReplay(1)
    );
  }

  private executeTx(
    tx: BundlrTransaction,
    bundlr: WebBundlr
  ): Observable<string> {
    return forkJoin([
      from(bundlr.getLoadedBalance()),
      from(bundlr.getPrice(tx.size))
    ]).pipe(
      map(([balance, cost]) => ({ cost, balance, tx })),
      mergeMap(({ cost, balance, tx }) => {
        if (balance.isLessThan(cost)) {
          return from(this.fundBundlr(cost, balance, bundlr)).pipe(map(_ => tx));
        } else {
          return of(tx);
        }
      }),
      mergeMap(tx => from(tx.sign()).pipe(map(_ => tx))),
      mergeMap(tx => from(tx.upload()).pipe(map(_ => tx))),
      map(tx => tx.id)
    );
  }

  private async fundBundlr(cost: BigNumber, balance: BigNumber, bundlr: WebBundlr) {
    // Fund your account with the difference
    // We multiply by 1.1 to make sure we don't run out of funds
    const requiredFunds = cost.multipliedBy(1.1).integerValue();
    const availableBalance = balance.minus(requiredFunds);
    if (availableBalance.isLessThanOrEqualTo(new BigNumber(0))) {
      throw new ShopError('There was an internal error while trying to fund the Bundlr network');
    }
    await bundlr.fund(requiredFunds);
  }
}