import { concat, from, Observable, of } from "rxjs";
import { map, mergeMap, pluck, share, shareReplay, toArray } from "rxjs/operators";
import { Inject, Injectable } from "@angular/core";

import { filterNotNull, Progress } from "src/app/shared";

import { Erc1155Metadata } from "src/app/shared";
import { ShopItem } from "src/app/core";
import { EncryptedZipWithMetadata, ENCRYPTION_SERVICE_TOKEN, FileCryptorService, ShopServiceFactory } from "src/app/shop";
import { UploadService, UPLOAD_SERVICE_TOKEN } from "src/app/blockchain";

interface NewShopItemSpec {
  name: string;
  description: string;
  price: string;
  payloadFile: File;
  thumbnails: File[];
  nftMetadata: Erc1155Metadata;
}

interface ItemCreationCheckpoint {
  usedItemId: string;
  fileName: string;
  savedPayloadId: string;
  savedItemThumbnailIds?: string[];
  savedNftMetadataId?: string;
  savedShopFileId?: string;
}

interface NewShopItemStrategy {
  createItem(newItemSpec: NewShopItemSpec): Observable<Progress<ShopItem>>;
}

@Injectable({
  providedIn: 'root'
})
export class NewShopItemService implements NewShopItemStrategy {

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
  createItem(newItemSpec: NewShopItemSpec): Observable<Progress<ShopItem>> {
    // Get the next token id because we need it to setup some metadata.

    this.findNextTokenId().pipe(
      mergeMap(x => this.encryptPayload(x[0], newItemSpec)),
      mergeMap(x => this.uploadFile(x.zipBlob)),
      // TODO add checkpoint here
      mergeMap(payloadArId =>
        concat([
          // Save the item thumbnails
          this.uploadThumbnails(newItemSpec),
          this.uploadString(JSON.stringify(newItemSpec.nftMetadata))
        ])
      ));

    // Regenerate merkle root
    // Update the shop config with new items + save it too

    // Update merkle root + shop file in SC

    return of();
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

  private uploadThumbnails(itemSpec: NewShopItemSpec): Observable<string[]> {
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