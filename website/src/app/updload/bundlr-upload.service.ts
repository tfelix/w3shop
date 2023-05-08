import { WebBundlr } from '@bundlr-network/client';
import { forkJoin, from, Observable, of, ReplaySubject } from 'rxjs';
import { map, mergeMap, share, shareReplay, take, tap } from 'rxjs/operators';

import { ShopError } from 'src/app/core';
import { UploadProgress, ProgressStage, UploadService } from './upload.service';
import BigNumber from 'bignumber.js';
import { BundlrService } from './bundlr.service';
import { BundlrTransaction } from '@bundlr-network/client/build/cjs/common/types';

export class BundlrUploadService implements UploadService {

  constructor(
    private readonly bundlrService: BundlrService
  ) {
  }

  // Unsure if the seperation of concern is correct here. Consider moving more logic
  // from BundlrServie into here. Its not clear what both responsibilities are. Maybe
  // Merge BundlrService into this one.
  fund(nBytes: number): Observable<string> {
    return this.bundlrService.fund(nBytes);
  }


  getUploadableBytesCount(): Observable<number> {
    return this.bundlrService.getUploadableBytesCount();
  }

  uploadBlob(blob: Blob): Observable<UploadProgress> {
    console.info('uploadBlob', blob.type);

    const tx$ = this.bundlrService.getBundlr().pipe(
      take(1),
      mergeMap(bundlr => {
        // Blobs are only used when uploading encrypted data. The stream is thus
        // only binary.
        const tags = [
          { name: 'Content-Type', value: 'application/octet-stream' }
        ];

        const buffer$ = from(blob.arrayBuffer()).pipe(
          map(data => Buffer.from(data))
        );

        return buffer$.pipe(
          map(buffer => bundlr.createTransaction(buffer, { tags })),
          shareReplay(1)
        );
      })
    );

    return this.executeTxWithProgress(tx$);
  }

  uploadJson(data: string): Observable<UploadProgress> {
    console.info('uploadJson', data);

    const tx$ = this.bundlrService.getBundlr().pipe(
      take(1),
      mergeMap(bundlr => this.makeTxFromJson(bundlr, data))
    );

    return this.executeTxWithProgress(tx$);
  }

  uploadFile(file: File): Observable<UploadProgress> {
    console.info('uploadFile', file.name);

    const tx$ = this.bundlrService.getBundlr().pipe(
      take(1),
      mergeMap(bundlr => this.makeTxFromFile(bundlr, file))
    );

    return this.executeTxWithProgress(tx$);
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

  private executeTxWithProgress(tx$: Observable<BundlrTransaction>): Observable<UploadProgress> {
    // It must be a replay subject because we already fill the observable before
    // the other angular components can subscribe to it.
    const sub = new ReplaySubject<UploadProgress>(1);
    const bundlr$ = this.bundlrService.getBundlr().pipe(take(1));

    forkJoin([bundlr$, tx$]).pipe(
      mergeMap(([bundlr, tx]) => this.executeTx(tx, bundlr))
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
      tap(tx => console.info('Bundlr Upload: ', tx.toJSON())),
      map(tx => 'ar://' + tx.id),
      share()
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