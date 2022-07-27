import { AbstractControl } from "@angular/forms";
import { BehaviorSubject, from, Observable } from "rxjs";
import { filter, map, mergeMap, pluck, share, tap, toArray } from "rxjs/operators";
import { Inject, Injectable } from "@angular/core";

import { BigNumber } from "ethers";

import { Progress } from "src/app/shared";
import { LitFileCryptorService } from "src/app/core/encryption/lit-file-cryptor.service";
import { ShopServiceFactory, UploadService } from "src/app/core";

interface NewShopItemSpec {
  name: string;
  description: string;
  price: string;
  payloadFile: File;
  nftThumbnail: File;
  descriptionThumbnails: File[];
}

interface ItemCreationCheckpoint {
  savedPayloadId: string;
  savedNftThumbnailId?: string;
  savedItemThumbnailIds?: string[];
  savedNftMetadataId?: string;
  savedShopFileId?: string;
}

interface NewShopItemStrategy {
  createItem(newItemSpec: NewShopItemSpec): Observable<Progress>;
}

// Generates ERC 1155 JSON files from the raw form fields.
class Erc1155JsonGenerator {

  generateJsonFiles(form: AbstractControl) {

  }
}

@Injectable({
  providedIn: 'root'
})
export class NewShopItemService implements NewShopItemStrategy {

  constructor(
    private readonly shopFactory: ShopServiceFactory,
    private readonly fileCryptor: LitFileCryptorService,
    @Inject('Upload') private readonly uploadService: UploadService,
  ) {

  }

  /**
   * TODO In order to save gas, this process should be batchable.
   * @returns
   */
  createItem(newItemSpec: NewShopItemSpec): Observable<Progress> {
    const sub = new BehaviorSubject<Progress>({ progress: 0, text: 'Encrypting files...' });

    // Set/Get a token id for usage in the shop.
    const nextTokenId$ = this.findNextTokenId();

    // Encrypt payload with access condition and lit
    const encryptedPayload$ = nextTokenId$.pipe(
      mergeMap(nextTokenId => this.fileCryptor.encryptFile(newItemSpec.payloadFile, nextTokenId)),
    );

    const payloadProgress$ = encryptedPayload$.pipe(
      mergeMap(encPayload => encPayload.zipBlob.arrayBuffer()),
      share()
    );

    // Save Payload
    const payloadArweaveId$ = encryptedPayload$.pipe(
      tap(() => sub.next({ progress: 20, text: 'Uploading content file...' })),
      mergeMap(encPayload => this.uploadFile(encPayload.zipBlob)),
    );

    // Save NFT Thumbnail
    const nftThumbnailId$ = this.uploadFile(newItemSpec.nftThumbnail);

    // Save Item Thumbnails
    const descriptionThumbnails$ = from(newItemSpec.descriptionThumbnails).pipe(
      mergeMap(file => this.uploadFile(file)),
      toArray()
    );

    // Generate NFT metadata
    // - update the original metadata with this id
    // - resolve current shop IPFS hash and fill in the external_uri

    // Save NFT Metadata
    // Will be available under https://arweave.net/<TX_ID>/<ID>

    // Update the shop config with new item + save it
    // Regenerate merkle root
    // Update merkle root + shop file in SC

    return sub.asObservable();
  }

  private uploadArrayBuffer(buffer: ArrayBuffer): Observable<string> {
    return this.uploadService.deployFiles(new Uint8Array(buffer)).pipe(
      pluck('fileId'),
      filter(x => !!x),
      share()
    ) as Observable<string>;
  }

  private uploadFile(file: File): Observable<string> {
    return from(file.arrayBuffer()).pipe(
      map(buffer => this.uploadService.deployFiles(new Uint8Array(buffer))),
      pluck('fileId'),
      filter(x => !!x),
      share()
    ) as Observable<string>;
  }

  private findNextTokenId(): Observable<BigNumber> {
    return this.shopFactory.shopService$.pipe(mergeMap(shop => shop.getItemService().nextItemId()))
  }
}