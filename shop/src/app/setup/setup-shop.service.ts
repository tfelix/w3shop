import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map, mergeMap, tap } from 'rxjs/operators';

import { Base64CoderService, CeramicService, WalletService } from 'src/app/core';
import { CID } from '../shared/model/cid';
import { NewShop } from './new-shop/new-shop';

enum DeployStage {
  DEPLOYING_CONTRACT,
  WAITING_FOR_CERAMIC, // We need to wait until the shop owner NFT is recognized by Ceramic via Indexer
  DEPLOYING_CERAMIC,
  SUCCESS,
}

interface DeployResult {
  stage: DeployStage,
  cid?: string
}

@Injectable({
  providedIn: 'root'
})
export class SetupShopService {

  constructor(
    private readonly walletService: WalletService,
    private readonly ceramicService: CeramicService,
    private readonly base64Coder: Base64CoderService
  ) { }

  // TODO This must return a DeployResult
  createShop(newShop: NewShop): Observable<string> {
    return this.deployShopContract().pipe(
      mergeMap(contractAddr => this.setupCeramicDocument(contractAddr, newShop)),
      map(cid => this.base64Coder.base64UrlEncode(cid))
    );
  }

  private deployShopContract(): Observable<string> {
    // First check if there is already an existing contract. We can then also short circuit the
    // new shop form because this would mean there is also shop data.
    const existingContract = localStorage.getItem(SetupShopService.STORAGE_CONTRACT_KEY);

    if (!!existingContract) {
      console.log('Existing contract id found in storage: ' + existingContract);

      return of(existingContract);
    } else {
      // this.walletService.deployContract();
      return of("0xe7e07f9dff6b48eba32641c53816f25368297d22").pipe(
        delay(1500),
        tap(contractAddr => {
          console.log('Deployed shop contract: ' + contractAddr);
          localStorage.setItem(SetupShopService.STORAGE_CONTRACT_KEY, contractAddr);
        })
      )
    }
  }

  private setupCeramicDocument(contractAddr: string, newShop: NewShop): Observable<CID> {
    const existingShopDocument = localStorage.getItem(SetupShopService.STORAGE_SHOP_DOC_KEY);
    if (!!existingShopDocument) {
      console.log('Existing shop document found in storage: ' + existingShopDocument);
      return of(existingShopDocument);
    } else {
      return of('CERAMIC_DOCUMENT_ID').pipe(
        delay(2500),
        tap(cid => {
          console.log('Created shop config document: ' + cid);
          localStorage.setItem(SetupShopService.STORAGE_SHOP_DOC_KEY, cid);
        })
      );
    }
  }

  private static readonly STORAGE_CONTRACT_KEY = 'SHOP_CONTRACT';
  private static readonly STORAGE_SHOP_DOC_KEY = 'SHOP_CERAMIC_CONFIG';
}
