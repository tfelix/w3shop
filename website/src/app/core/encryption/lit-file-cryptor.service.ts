import { forkJoin, from, Observable, of } from "rxjs";
import LitJsSdk from 'lit-js-sdk';
import { saveAs } from 'file-saver';

import { buildShopItemUrl } from "src/app/shared";
import { map, mergeMap, shareReplay } from "rxjs/operators";
import { ChainIds, ProviderService, ShopError, ShopServiceFactory } from "src/app/core";
import { Injectable } from "@angular/core";
import { BigNumber } from "ethers";

interface EncryptedZipWithMetadata {
  zipBlob: File
}

interface DecryptedZip {
  decryptedFile: ArrayBuffer,
  metadata: any;
}

@Injectable({
  providedIn: 'root'
})
export class LitFileCryptorService {
  private readonly litClient$ = of(new LitJsSdk.LitNodeClient()).pipe(
    mergeMap(client => from(client.connect())),
    shareReplay(1)
  );

  private readonly threshold20MbInBytes = 1024 * 20;

  constructor(
    private readonly shopFactory: ShopServiceFactory,
    private readonly providerService: ProviderService
  ) {
  }

  private getLitChain(): Observable<string> {
    return this.providerService.chainId$.pipe(
      map(chainId => {
        switch (chainId) {
          case ChainIds.ARBITRUM:
            return 'arbitrum';
          default:
            throw new ShopError(`Chain ID ${chainId} is currently not supported by Lit Protocol`);
        }
      })
    );
  }

  private buildAccessCondition(
    tokenId: BigNumber,
    shopTokenContractAddress: string,
    litChain: string
  ) {
    const accessControlConditions = [
      {
        contractAddress: shopTokenContractAddress,
        standardContractType: 'ERC1155',
        chain: litChain,
        method: 'balanceOf',
        parameters: [
          ':userAddress',
          tokenId.toString()
        ],
        returnValueTest: {
          comparator: '>',
          value: '0'
        }
      }
    ];

    console.debug('Generated Access Conditions: ', accessControlConditions);

    return accessControlConditions;
  }

  /**
   * Encrypts the given shop file and makes it ready for uploading.
   *
   * @param file The file payload of the item to put into the shop.
   * @param tokenId The token ID that will represent this shop item NFT.
   * @returns
   */
  encryptFile(
    file: File,
    tokenId: BigNumber,
  ): Observable<EncryptedZipWithMetadata> {
    if (file.size > this.threshold20MbInBytes) {
      // > 20 MB use the encryptFile API and store metadata by our own

      /*
       * You now need to save the accessControlConditions, encryptedSymmetricKey, and the encryptedString.
       * You will present the accessControlConditions and encryptedSymmetricKey to obtain the decrypted
       * symmetric key, which you can then use to decrypt the encryptedString.
       */
      throw new ShopError('Can currently not encrypt files > 20MB. Please choose a smaller file.');
    }

    const litChain$ = this.getLitChain().pipe(shareReplay(1));
    const authSig$ = litChain$.pipe(mergeMap(chain => LitJsSdk.checkAndSignAuthMessage({ chain })));

    return forkJoin([
      authSig$,
      this.litClient$,
      this.shopFactory.shopService$,
      litChain$
    ]).pipe(
      mergeMap(([
        authSig,
        litClient,
        shop,
        litChain
      ]) => {
        // < 20MB encryptFileAndZipWithMetadata
        const accessCondition = this.buildAccessCondition(tokenId, shop.smartContractAddress, litChain);

        return LitJsSdk.encryptFileAndZipWithMetadata({
          authSig,
          accessControlConditions: [accessCondition],
          chain: litChain,
          file,
          litNodeClient: litClient,
          readme: this.buildReadme(shop.identifier, tokenId)
        }) as Promise<EncryptedZipWithMetadata>;
      })
    );
  }

  decryptFile(encryptedFile: File | Blob): Observable<DecryptedZip> {
    const litChain$ = this.getLitChain().pipe(shareReplay(1));
    const authSig$ = litChain$.pipe(mergeMap(chain => LitJsSdk.checkAndSignAuthMessage({ chain })))

    return forkJoin([
      authSig$,
      this.litClient$,
    ]).pipe(
      mergeMap(([
        authSig,
        litClient,
      ]) => {
        return LitJsSdk.decryptZipFileWithMetadata({
          authSig,
          litClient,
          file: encryptedFile,
        });
      })) as Observable<DecryptedZip>;
  }

  /**
   * An optional readme text that will be inserted into readme.txt in the final zip file.
   * This is useful in case someone comes across this zip file and wants to know how to
   * decrypt it. This file could contain instructions and a URL to use to decrypt the file.
   */
  private buildReadme(shopIdentifier: string, tokenId: BigNumber): string {
    return `=== README ===

This file content is encrypted by the Lit Protocol and part of a digital shop item.

Please visit ${buildShopItemUrl(shopIdentifier, tokenId)} for instruction on how to decrypt it.`;
  }
}