import { concat, from, Observable, of } from "rxjs";
import { map, mergeMap, pluck, share, toArray } from "rxjs/operators";
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
  nftThumbnail: File;
  descriptionThumbnails: File[];
  nftMetadata: Erc1155Metadata;
}

interface ItemCreationCheckpoint {
  savedPayloadId: string;
  savedNftThumbnailId?: string;
  savedItemThumbnailIds?: string[];
  savedNftMetadataId?: string;
  savedShopFileId?: string;
}

interface CreateItemProgress<T> {
  data: T,
  progress: Progress<ShopItem>
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
   * TODO In order to save gas, this process should be batchable.
   * @returns
   */
  createItem(newItemSpec: NewShopItemSpec): Observable<Progress<ShopItem>> {
    // Set/Get a token id for usage in the shop.
    this.findNextTokenId().pipe(
      mergeMap(x => this.encryptPayload(x.data, newItemSpec)),
      mergeMap(x => this.uploadFile(x.data.zipBlob)),
      mergeMap(payloadArId =>
        concat([
          // Save Payload
          // this.uploadFile(x.data.zipBlob),
          // Save NFT Thumbnails
          this.uploadFile(newItemSpec.nftThumbnail),
          // Save Item Thumbnails
          this.uploadDescriptionThumbnails(newItemSpec),
          this.uploadString(JSON.stringify(newItemSpec.nftMetadata))
        ]))
    );

    // Save NFT Metadata
    // Will be available under https://arweave.net/<TX_ID>/<ID>

    // Update the shop config with new item + save it
    // Regenerate merkle root
    // Update merkle root + shop file in SC

    return of();
  }

  private uploadString(data: string): Observable<string> {
    return this.uploadService.deployFiles(data).pipe(
      pluck('fileId'),
      filterNotNull(),
      share()
    ) as Observable<string>;
  }

  private uploadFile(file: File): Observable<string> {
    return from(file.arrayBuffer()).pipe(
      map(buffer => this.uploadService.deployFiles(new Uint8Array(buffer))),
      pluck('fileId'),
      filterNotNull(),
      share()
    ) as Observable<string>;
  }

  private uploadDescriptionThumbnails(itemSpec: NewShopItemSpec): Observable<string[]> {
    return from(itemSpec.descriptionThumbnails).pipe(
      mergeMap(file => this.uploadFile(file)),
      toArray()
    );
  }

  private findNextTokenId(): Observable<CreateItemProgress<string>> {
    return this.shopFactory.shopService$.pipe(
      mergeMap(shop => shop.getNextItemIds(1)),
      map(x => {
        return {
          data: x[0],
          progress: { progress: 10, text: 'Encrypting payload with access condition...', result: null }
        }
      })
    );
  }

  private encryptPayload(
    tokenId: string,
    itemSpec: NewShopItemSpec
  ): Observable<CreateItemProgress<EncryptedZipWithMetadata>> {
    // Encrypt payload with access condition and lit
    return this.fileCryptor.encryptFile(itemSpec.payloadFile, tokenId).pipe(
      map(x => {
        return {
          data: x,
          progress: { progress: 10, text: '', result: null }
        }
      })
    )
  }
}