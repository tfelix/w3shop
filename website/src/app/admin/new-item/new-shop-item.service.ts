import { AbstractControl } from "@angular/forms";
import { from, Observable, of, ReplaySubject, Subject } from "rxjs";
import LitJsSdk from 'lit-js-sdk'

import { Progress } from "src/app/shared";
import { mergeMap, shareReplay } from "rxjs/operators";
import { ShopError, ShopServiceFactory } from "src/app/core";
import { Injectable } from "@angular/core";

interface NewShopItemStrategy {
  createItem();
}

// Generates ERC 1155 JSON files from the raw form fields.
class Erc1155JsonGenerator {

  generateJsonFiles(form: AbstractControl) {

  }
}

class LitFileCryptorService {
  private readonly litClient$ = of(new LitJsSdk.LitNodeClient()).pipe(
    mergeMap(client => from(client.connect())),
    shareReplay(1)
  );

  private readonly threshold20Mb = 1024 * 20;
  private readonly litChain: string;

  constructor(
    private readonly shopFactory: ShopServiceFactory
  ) {
    // TODO this must be done conditionally depending on which chain we are.
    this.litChain = 'arbitrum';
  }

  private buildAccessCondition(
    tokenId: string,
    shopTokenContractAddress: string
  ) {
    const accessControlConditions = [
      {
        contractAddress: shopTokenContractAddress,
        standardContractType: 'ERC1155',
        chain: this.litChain,
        method: 'balanceOf',
        parameters: [
          ':userAddress',
          tokenId
        ],
        returnValueTest: {
          comparator: '>',
          value: '0'
        }
      }
    ];

    return accessControlConditions;
  }

  /**
   * Encrypts the given shop file and makes it ready for uploading.
   *
   * @param file The file payload of the item to put into the shop.
   * @param tokenId The token ID that will represent this shop item NFT.
   * @returns
   */
  encryptShopFile(file: File, tokenId: string): Observable<Progress> {
    const sub = new ReplaySubject<Progress>(1);

    // this.encryptPayloadFile();

    return sub.asObservable();
  }

  decryptFile(encryptedFile: File): Observable<Progress> {
    const sub = new ReplaySubject<Progress>(1);

    return sub.asObservable();
  }

  private sendUpdate(sub: Subject<Progress>, progress: number, text: string) {
    sub.next({
      progress,
      text
    });
  }

  /**
   * An optional readme text that will be inserted into readme.txt in the final zip file.
   * This is useful in case someone comes across this zip file and wants to know how to
   * decrypt it. This file could contain instructions and a URL to use to decrypt the file.
   */
  private buildReadme(): string {
    return '';
  }

  private async encryptPayloadFile(
    litClient: any,
    sub: Subject<Progress>,
    file: File,
    shopTokenContractAddress: string,
    tokenId: string
  ) {
    this.sendUpdate(sub, 10, 'Sign into Lit Protocol to encrypt the files');
    const authSig = await LitJsSdk.checkAndSignAuthMessage({ chain: this.litChain });

    if (file.size < this.threshold20Mb) {
      // < 20MB encryptFileAndZipWithMetadata
      // returns zipBlob, encryptedSymmetricKey, and symmetricKey
      await LitJsSdk.encryptFileAndZipWithMetadata({
        authSig,
        accessControlConditions: [this.buildAccessCondition(tokenId, shopTokenContractAddress)],
        chain: this.litChain,
        file,
        litNodeClient: litClient,
        readme: this.buildReadme()
      });
    } else {
      // > 20 MB encryptFile store metadata by our own

      /**
       * You now need to save the accessControlConditions, encryptedSymmetricKey, and the encryptedString.
       * You will present the accessControlConditions and encryptedSymmetricKey to obtain the decrypted
       * symmetric key, which you can then use to decrypt the encryptedString.
       * */

      throw new ShopError('Encryption of file > 20MB is currently not supported');
    }
  }
}

@Injectable({
  providedIn: 'root'
})
export class NewShopItemService implements NewShopItemStrategy {

  constructor(
    private readonly fileCryptor: LitFileCryptorService
  ) {

  }

  /**
   * TODO In order to save gas, this process must be batchable.
   * @returns
   */
  createItem(): Observable<Progress> {
    const sub = new ReplaySubject<Progress>(1);

    // Set a token id for usage in the shop.

    // Encrypt payload with access condition and lit

    // Save NFT JPGs
    // Save



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
}