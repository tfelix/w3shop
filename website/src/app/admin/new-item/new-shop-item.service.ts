import { AbstractControl } from "@angular/forms";
import { BehaviorSubject, Observable } from "rxjs";

import { Progress } from "src/app/shared";
import { Injectable } from "@angular/core";
import { BigNumber } from "ethers";
import { ShopServiceFactory } from "src/app/core";
import { mergeMap } from "rxjs/operators";
import { LitFileCryptorService } from "./lit-file-cryptor.service";

interface NewShopItemSpec {
  name: string;
  description: string;
  price: string;
  payloadFile: File;
  nftThumbnail: File;
  descriptionThumbnails: File[];
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
    private readonly fileCryptor: LitFileCryptorService
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
    this.fileCryptor.encryptFile()

    // Save Payload
    // Save NFT Thumbnail
    // Save Item Thumbnails

    // Save the initial raw data in case something goes wrong. Probably does not work for files so they must
    // be excluded.

    // Generate NFT metadata
    // - Upload folder of locales to get the arweave id
    // - update the original metadata with this id
    // - resolve current shop IPFS hash and fill in the external_uri

    // Will be available at https://arweave.net/<TX_ID>/<ID>

    // Regenerate merkle root
    // Update merkle root + new arweave shop file in SC

    return sub.asObservable();
  }

  private findNextTokenId(): Observable<BigNumber> {
    const shop = this.shopFactory.build();

    return shop.items$.pipe(mergeMap(is => is.nextItemId()))
  }

  private encryptFile() {

  }
}