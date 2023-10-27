import { combineLatest, forkJoin, from, Observable, of } from 'rxjs';
import { catchError, delayWhen, map, mergeMap, share, shareReplay, take, tap } from 'rxjs/operators';
import { Networks, NetworkService, ShopError } from 'src/app/core';
import { Injectable } from '@angular/core';

import { ProviderService } from 'src/app/blockchain';

import { EncryptedFileMeta, FileCryptorService } from './file-cryptor.service';
import { checkAndSignAuthMessage, encryptFile, LitNodeClient } from '@lit-protocol/lit-node-client';

interface EncryptFileResult {
  encryptedFile: Blob,
  symmetricKey: Uint8Array
}

interface EncryptKeyResult {
  encryptedKeyBase16: string,
  accessCondition: any,
  accessConditionBase64: string;
}

@Injectable({
  providedIn: 'root'
})
export class LitFileCryptorService implements FileCryptorService {
  // TODO later set debug to false via environment.production
  // Must be reworked with: https://developer.litprotocol.com/v3/sdk/access-control/encryption
  private readonly litClient$: Observable<any> = of(new LitJsSdk.LitNodeClient({ debug: true })).pipe(
    delayWhen(client => from(client.connect())),
    shareReplay(1)
  );

  private authSig$: Observable<any>;

  constructor(
    private readonly providerService: ProviderService,
    private readonly networkService: NetworkService
  ) {
  }

  /**
   * Encrypts the given shop file and makes it ready for uploading.
   *
   * @param file The file payload of the item to put into the shop.
   * @param nextTokenId The token ID that will represent this shop item NFT.
   * @returns
   */
  encryptPayloadFile(
    file: File,
    shopContractAddress: string,
    nextTokenId: string,
  ): Observable<EncryptedFileMeta> {
    const encryptedFile$ = from(encryptFile({ file }) as Promise<EncryptFileResult>).pipe(
      share()
    );

    const encryptedSymmetricKey$ = encryptedFile$.pipe(
      mergeMap(x => this.encryptSymmetricKey(shopContractAddress, nextTokenId, x.symmetricKey)),
    );

    return forkJoin([
      encryptedFile$,
      encryptedSymmetricKey$,
    ]).pipe(
      map(([encFiles, encKey]) => {
        return {
          encryptedKeyBase64: encKey.encryptedKeyBase16,
          accessCondition: encKey.accessCondition,
          encryptedFile: encFiles.encryptedFile,
          accessConditionBase64: encKey.accessConditionBase64
        };
      }),
      catchError(err => {
        throw new ShopError(`There was an error while encrypting the file ${file.name}.`, err);
      })
    );
  }

  /**
   * Returns the encrypted symmetric key.
   */
  private encryptSymmetricKey(
    shopContractAddress: string,
    tokenId: string,
    symmetricKey: Uint8Array
  ): Observable<EncryptKeyResult> {
    const litChain$ = this.getLitChain().pipe(take(1));
    const authSig$ = this.obtainAuthSig().pipe(take(1));

    return forkJoin([
      litChain$,
      authSig$,
      this.litClient$,
    ]).pipe(
      mergeMap(([litChain, authSig, litClient]) => {
        const accessCondition = this.buildAccessCondition(tokenId, litChain, shopContractAddress);

        return from(litClient.saveEncryptionKey({
          accessControlConditions: [accessCondition],
          symmetricKey: symmetricKey,
          authSig: authSig,
          chain: litChain,
        })).pipe(
          map(encryptedSymmetricKey => ({
            // Must be a hex string for a proper decryption.
            encryptedKeyBase16: LitJsSdk.uint8arrayToString(encryptedSymmetricKey, 'base16') as string,
            accessCondition,
            accessConditionBase64: window.btoa(JSON.stringify(accessCondition))
          })),
          share(),
          tap(x => console.debug('Created encryption key', x))
        );
      })
    );
  }

  decryptPayloadFile(
    encryptedFile: Blob,
    encryptedKeyBase16: string,
    accessConditionBase64: string
  ): Observable<Blob> {
    const litChain$ = this.getLitChain().pipe(take(1));
    const authSig$ = this.obtainAuthSig().pipe(take(1));
    const accessCondition = JSON.parse(window.atob(accessConditionBase64));

    return forkJoin([
      litChain$,
      authSig$,
      this.litClient$,
    ]).pipe(
      mergeMap(([litChain, authSig, litClient]) => {
        // Decrept the symmetric key
        return from(litClient.getEncryptionKey({
          accessControlConditions: [accessCondition],
          toDecrypt: encryptedKeyBase16,
          chain: litChain,
          authSig: authSig,
        })) as Observable<Uint8Array>;
      }),
      catchError(err => {
        throw new ShopError('Could not decrypt encryption key', err);
      }),
      tap(_ => console.log('Obtained decrypted symmetric key')),
      mergeMap(decryptedKey => {
        return from(LitJsSdk.decryptFile({
          file: encryptedFile,
          symmetricKey: decryptedKey
        })) as Observable<ArrayBuffer>;
      }),
      catchError(err => {
        throw new ShopError('Could not decrypt file', err);
      }),
      tap(_ => console.log('File was decrypted successfully')),
      map(buffer => new Blob([buffer], { type: encryptedFile.type }))
    );
  }

  private getLitChain(): Observable<string> {
    return this.providerService.chainId$.pipe(
      map(chainId => {
        switch (chainId) {
          case Networks.ARBITRUM_ONE.chainId:
            return 'arbitrum';
          default:
            throw new ShopError(`Chain ID ${chainId} is currently not supported by Lit Protocol`);
        }
      }),
      share()
    );
  }

  private buildAccessCondition(
    tokenId: string,
    litChain: string,
    shopContractAddress: string,
  ): any {
    const accessControlCondition = {
      contractAddress: shopContractAddress,
      standardContractType: 'ERC1155',
      chain: litChain,
      method: 'balanceOf',
      parameters: [
        ':userAddress',
        tokenId
      ],
      returnValueTest: {
        comparator: '>',
        value: '0'
      }
    };

    console.info('Generated Access Conditions: ', accessControlCondition);

    return accessControlCondition;
  };


  private obtainAuthSig(): Observable<any> {
    if (!this.authSig$) {
      const network = this.networkService.getExpectedNetwork();

      this.authSig$ = combineLatest([
        this.providerService.address$,
        this.providerService.provider$
      ]).pipe(
        // checkAndSignAuthMessage would probably the better option, but we can not
        // input our current wallet provider, resulting in the popup of a WalletConnect
        // screen which is a bad UX. This however forces the user to sign more often
        // as it does not check the localStorage from Lit SDK where it saved the auth msg.
        // We could probably implement our own storage solution to bypass the checkAndSignAuth
        // function.
        mergeMap(([address, provider]) => from(LitJsSdk.signAndSaveAuthMessage({
          web3: provider,
          account: address,
          chainId: network.chainId
        }))),
        shareReplay(1),
        catchError(err => {
          throw new ShopError('Error during Lit signature generation.', err);
        })
      );
    }

    return this.authSig$;
  }
}