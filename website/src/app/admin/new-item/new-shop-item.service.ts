import { forkJoin, from, Observable, ReplaySubject } from "rxjs";
import { map, mergeMap, pluck, shareReplay, take, tap, toArray } from "rxjs/operators";
import { Inject, Injectable } from "@angular/core";

import { buildShopItemUrl, Erc1155Metadata, filterNotNull, Progress } from "src/app/shared";

import { ShopItem } from "src/app/core";
import { EncryptedZipWithMetadata, ENCRYPTION_SERVICE_TOKEN, FileCryptorService, ShopServiceFactory } from "src/app/shop";
import { UploadService, UPLOAD_SERVICE_TOKEN } from "src/app/blockchain";
import { ShopStatus } from "src/app/shop/items/shop-error/shop-error.service";

interface NewShopItemSpec {
  name: string;
  description: string;
  price: string;
  payloadFile: File;
  thumbnails: File[];
}

interface ItemCreationCheckpoint {
  usedItemId: string;
  fileName: string;
  savedPayloadId: string;
  savedItemThumbnailIds?: string[];
  savedNftMetadataId?: string;
  savedShopFileId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NewShopItemService {

  constructor(
    private readonly shopFactory: ShopServiceFactory,
    @Inject(ENCRYPTION_SERVICE_TOKEN) private readonly fileCryptor: FileCryptorService,
    @Inject(UPLOAD_SERVICE_TOKEN) private readonly uploadService: UploadService,
  ) {
  }

  /**
   * TODO In order to save gas, this process should be batchable for possible multiple items. Try
   *   to require as little signature as possible from the user.
   * @returns
   */
  createItem(newItemSpec: NewShopItemSpec): Observable<Progress<ShopItem[]>> {
    // It must be a replay subject because we already fill the observable before
    // the other angular components can subscribe to it.
    const sub = new ReplaySubject<Progress<ShopItem[]>>(1);

    const shop$ = this.shopFactory.getShopService().pipe(take(1));
    const shopIdentifier$ = shop$.pipe(map(x => x.identifier));

    const payloadFileId$ = this.findNextTokenId().pipe(
      tap(x => console.info('Next Item IDs: ', x)),
      tap(_ => this.makeProgress(sub, 1, 'Encrypt the file content')),
      mergeMap(x => this.encryptPayload(x[0], newItemSpec)
        .pipe(map(payload => ({ itemTokenId: x[0], payload })))),
      tap(_ => this.makeProgress(sub, 10, 'Uploading the encrypted file')),
      mergeMap(({ itemTokenId, payload }) => this.uploadFile(payload.zipBlob)
        .pipe(map(fileId => ({ itemTokenId, fileId }))))
    );

    const thumbnailIds$ = this.uploadThumbnails(sub, newItemSpec);

    const nftMetadata$ = forkJoin([
      shopIdentifier$,
      payloadFileId$,
      thumbnailIds$
    ]).pipe(
      map(([shopIdentifier, payloadFileId, thumbnailIds]) => {
        const nftMeta = this.makeNftMetadata(
          newItemSpec,
          shopIdentifier,
          payloadFileId.itemTokenId,
          this.makeArweaveUri(thumbnailIds[0]),
          this.makeArweaveUri(payloadFileId.fileId)
        );

        return {
          nftMeta,
          itemTokenId: payloadFileId.itemTokenId
        }
      }),
      shareReplay(1)
    );

    const nftMetadataUri$ = nftMetadata$.pipe(
      mergeMap(nftMetadata => this.uploadString(JSON.stringify(nftMetadata.nftMeta))),
      map(fileId => this.makeArweaveUri(fileId))
    );

    const shopItemUriUpdate$ = forkJoin([shop$, nftMetadata$, nftMetadataUri$]).pipe(
      mergeMap(([shop, meta, uri]) => shop.addItemUri(meta.itemTokenId, uri))
    );

    // Write updated shop config file with new items to Arweave
    // TODO write shop config file to sc
    // TODO Update merkle root sc

    /*
    mergeMap().subscribe(fileId => {
      sub.next(this.makeProgress(
        100,
        'Created new item(s) for your shop!'
        // FIXME somehow add the created items here.
      ));
      sub.complete();
    }, err => {
      sub.error(err);
      sub.complete();
    });
*/


    return sub.asObservable();
  }

  private makeArweaveUri(uri: string): string {
    return 'ar://' + uri;
  }

  private makeNftMetadata(
    spec: NewShopItemSpec,
    shopIdentifier: string,
    tokenId: string,
    mainThumbnailUri: string,
    payloadUri: string
  ): Erc1155Metadata {
    return {
      name: spec.name,
      description: spec.description,
      decimals: 0,
      external_uri: buildShopItemUrl(shopIdentifier, tokenId),
      image: mainThumbnailUri,
      attributes: [{ value: 'Digital Item' }],
      properties: {
        content_uri: payloadUri
      }
    };
  }

  private updateItemUri(
    sub: ReplaySubject<Progress<ShopItem[]>>,
    itemId: string,
    itemUri: string
  ): Observable<void> {
    this.makeProgress(sub, 15, 'Registering new item in shop');
    return this.shopFactory.getShopService().pipe(
      mergeMap(shop => shop.addItemUri(itemId, itemUri))
    );
  }

  private makeProgress(
    sub: ReplaySubject<Progress<ShopItem[]>>,
    percent: number,
    text: string,
    result?: ShopItem[]
  ) {
    const progress = {
      progress: percent,
      text: text,
      result: result || null
    };
    sub.next(progress);
  }

  private uploadString(data: string): Observable<string> {
    return this.uploadService.uploadJson(data).pipe(
      pluck('fileId'),
      filterNotNull(),
      shareReplay(1)
    ) as Observable<string>;
  }

  private uploadFile(file: File): Observable<string> {
    return this.uploadService.uploadFile(file).pipe(
      pluck('fileId'),
      filterNotNull(),
      shareReplay(1)
    ) as Observable<string>;
  }

  private uploadThumbnails(
    sub: ReplaySubject<Progress<ShopItem[]>>,
    itemSpec: NewShopItemSpec
  ): Observable<string[]> {
    // TODO let the updates trigger one by one and count the thumbnails e.g. 2/4 thumbnails
    this.makeProgress(sub, 30, 'Uploading the thumbnails');

    return from(itemSpec.thumbnails).pipe(
      mergeMap(file => this.uploadFile(file)),
      toArray()
    );
  }

  private findNextTokenId(): Observable<string[]> {
    return this.shopFactory.getShopService().pipe(
      // Later also support up to 5 new items as a batch creation.
      mergeMap(shop => shop.getNextItemIds())
    );
  }

  private encryptPayload(
    nextTokenId: string,
    itemSpec: NewShopItemSpec
  ): Observable<EncryptedZipWithMetadata> {
    // Encrypt payload with access condition and lit
    return this.fileCryptor.encryptPayloadFile(itemSpec.payloadFile, nextTokenId);
  }
}