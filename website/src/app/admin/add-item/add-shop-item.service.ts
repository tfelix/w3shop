import { concat, forkJoin, from, Observable, ReplaySubject } from 'rxjs';
import { map, mergeMap, pluck, share, shareReplay, take, tap, toArray } from 'rxjs/operators';
import { Inject, Injectable } from '@angular/core';

import { buildShopItemUrl, Erc1155Metadata, filterNotNull, ItemV1, Progress } from 'src/app/shared';

import { ShopError } from 'src/app/core';
import { ShopItem, ShopServiceFactory } from 'src/app/shop';
import { UploadService, UPLOAD_SERVICE_TOKEN } from 'src/app/updload';
import { EncryptedFileMeta, ENCRYPTION_SERVICE_TOKEN, FileCryptorService } from 'src/app/encryption';

export interface NewShopItemSpec {
  name: string;
  description: string;
  price: string;
  keywords: string[],
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
export class AddShopItemService {

  constructor(
    private readonly shopFactory: ShopServiceFactory,
    @Inject(ENCRYPTION_SERVICE_TOKEN) private readonly fileCryptor: FileCryptorService,
    @Inject(UPLOAD_SERVICE_TOKEN) private readonly uploadService: UploadService,
  ) {
  }

  private verifyFileSizeLimit(file: File) {
    // 500 MB
    const currentFileLimitBytes = 500 * 1024 * 1024;
    if (file.size > currentFileLimitBytes) {
      throw new ShopError('Currently you can not upload more than 500 MB');
    }
  }

  /**
   * TODO In order to save gas, this process should be batchable for possible multiple items. Try
   *   to require as little signature as possible from the user.
   * @returns
   */
  createItem(
    shopContractAddress: string,
    newItemSpec: NewShopItemSpec
  ): Observable<Progress<ShopItem[]>> {
    this.verifyFileSizeLimit(newItemSpec.payloadFile);
    newItemSpec.thumbnails.forEach(thumbnailFile => {
      this.verifyFileSizeLimit(thumbnailFile);
    });


    // It must be a replay subject because we already fill the observable before
    // the other angular components can subscribe to it.
    const sub = new ReplaySubject<Progress<ShopItem[]>>(1);

    const payloadUploadInfo$ = this.findNextTokenId().pipe(
      tap(_ => this.makeProgress(sub, 1, 'Encrypting the file content')),
      mergeMap(x => this.encryptPayload(shopContractAddress, x[0], newItemSpec)
        .pipe(map(meta => ({ itemTokenId: x[0], meta }))))
    );

    const uploadedPayloadInfo$ = payloadUploadInfo$.pipe(
      tap(_ => this.makeProgress(sub, 10, 'Uploading the encrypted file')),
      mergeMap(({ itemTokenId, meta }) => this.uploadFile(meta.encryptedFile)
        .pipe(
          map(fileId => ({
            itemTokenId,
            fileId,
            encryptedKeyBase64: meta.encryptedKeyBase64,
            // TODO base64 encode this already in the cryptor service
            accessConditionBase64: window.btoa(JSON.stringify(meta.accessCondition))
          })),
          tap(x => console.log('Uploaded Info', x))
        )
      ),
      shareReplay(1)
    );

    const shop$ = this.shopFactory.getShopService().pipe(take(1));
    const shopIdentifier$ = shop$.pipe(map(x => x.identifier));
    const thumbnailIds$ = this.uploadThumbnails(sub, newItemSpec);

    const nftMetadata$ = forkJoin([
      shopIdentifier$,
      uploadedPayloadInfo$,
      thumbnailIds$
    ]).pipe(
      tap(_ => console.log('Prepare NFT Meta', _)),
      map(([shopIdentifier, payloadInfo, thumbnailIds]) => {
        const nftMeta = this.makeNftMetadata(
          newItemSpec,
          shopIdentifier,
          payloadInfo.itemTokenId,
          thumbnailIds[0],
          payloadInfo.fileId,
          payloadInfo.accessConditionBase64,
          payloadInfo.encryptedKeyBase64
        );

        return {
          nftMeta,
          itemTokenId: payloadInfo.itemTokenId
        };
      }),
      tap(x => console.log('NFT Meta', x)),
      shareReplay(1)
    );

    const nftMetadataUri$ = nftMetadata$.pipe(
      tap(_ => console.log('Uploading NFT Metadata')),
      mergeMap(nftMetadata => this.uploadJson(JSON.stringify(nftMetadata.nftMeta))),
      tap(x => console.log('nftMetadataUri', x)),
      shareReplay(1)
    );

    const shopItemUriUpdate$ = forkJoin([shop$, nftMetadataUri$]).pipe(
      tap(_ => this.makeProgress(sub, 15, 'Registering new item in shop')),
      mergeMap(([shop, uri]) => shop.addItemUri(uri)),
      shareReplay(1)
    );

    // Now update the shop with the latest item info.
    const itemDataUri$ = thumbnailIds$.pipe(
      mergeMap(thumbnailUris => {
        const itemData = this.makeItemData(newItemSpec, thumbnailUris);
        return this.uploadJson(JSON.stringify(itemData));
      }),
      shareReplay(1)
    );

    const updateShopRootAndConfig$ = forkJoin([
      shop$,
      nftMetadata$,
      itemDataUri$
    ]).pipe(
      mergeMap(([shop, nftMetadata, itemDataUri]) => {
        // later this must be batchable for up to 5 items
        shop.getItemService().addItem(nftMetadata.itemTokenId, itemDataUri);

        return shop.updateItemsConfigAndRoot();
      })
    );

    // Force a orderly execution of the observables
    concat(
      uploadedPayloadInfo$,
      thumbnailIds$,
      nftMetadataUri$,
      shopItemUriUpdate$,
      updateShopRootAndConfig$
    ).subscribe(x => {
      console.log('Result: ', x);
      // this.makeProgress(sub, 100, 'Created new item(s) for your shop!');
      // sub.complete();
    }, err => {
      sub.error(err);
      sub.complete();
    });

    return sub.asObservable();
  }

  private makeItemData(
    spec: NewShopItemSpec,
    thumbnailUris: string[]
  ): ItemV1 {
    return {
      version: '1',
      name: spec.name,
      description: spec.description,
      // For now its just the normal description. Later make this independent from each other
      detailedDescription: spec.description,
      price: spec.price,
      mime: spec.payloadFile.type,
      filename: spec.payloadFile.name,
      isSold: true,
      thumbnails: thumbnailUris
    };
  }

  private makeNftMetadata(
    spec: NewShopItemSpec,
    shopIdentifier: string,
    tokenId: string,
    nftImage: string,
    payloadUri: string,
    accessConditionBase64: string,
    encryptedKey: string
  ): Erc1155Metadata {
    return {
      name: spec.name,
      description: spec.description,
      decimals: 0,
      external_uri: buildShopItemUrl(shopIdentifier, tokenId),
      image: nftImage,
      attributes: [{ value: 'Digital Item' }],
      properties: {
        version: 1,
        content_uri: payloadUri,
        access_condition: accessConditionBase64,
        encrypted_key: encryptedKey
      }
    };
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

  private uploadJson(data: string): Observable<string> {
    return this.uploadService.uploadJson(data).pipe(
      pluck('fileId'),
      filterNotNull(),
    ) as Observable<string>;
  }

  private uploadFile(blob: Blob): Observable<string> {
    return this.uploadService.uploadBlob(blob).pipe(
      pluck('fileId'),
      filterNotNull(),
      share()
    ) as Observable<string>;
  }

  private uploadThumbnails(
    sub: ReplaySubject<Progress<ShopItem[]>>,
    itemSpec: NewShopItemSpec
  ): Observable<string[]> {
    // TODO let the updates trigger one by one and count the thumbnails e.g. 2/4 thumbnails
    this.makeProgress(sub, 30, 'Uploading the thumbnails');

    console.log('Uploading thumbs', itemSpec.thumbnails);

    return from(itemSpec.thumbnails).pipe(
      mergeMap(file => this.uploadFile(file)),
      toArray(),
      shareReplay(1)
    );
  }

  private findNextTokenId(): Observable<string[]> {
    return this.shopFactory.getShopService().pipe(
      // Later also support up to 5 new items as a batch creation.
      mergeMap(shop => shop.getNextItemIds()),
      shareReplay(1)
    );
  }

  private encryptPayload(
    shopContractAddress: string,
    nextTokenId: string,
    itemSpec: NewShopItemSpec
  ): Observable<EncryptedFileMeta> {
    // Encrypt payload with access condition and lit
    return this.fileCryptor.encryptPayloadFile(itemSpec.payloadFile, shopContractAddress, nextTokenId)
      .pipe(share());
  }
}