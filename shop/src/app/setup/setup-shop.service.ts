import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map, mergeMap, tap } from 'rxjs/operators';

import { CeramicService, WalletService } from 'src/app/core';
import { Base64CoderService } from '../core/base64-coder.service';
import { CID } from '../shared/model/cid';

@Injectable({
  providedIn: 'root'
})
export class SetupShopService {

  constructor(
    private readonly walletService: WalletService,
    private readonly ceramicService: CeramicService,
    private readonly base64Coder: Base64CoderService
  ) { }

  createShop(): Observable<string> {
    return this.deployShopContract().pipe(
      mergeMap(contractAddr => this.setupCeramicDocument(contractAddr)),
      map(cid => this.base64Coder.base64UrlEncode(cid))
    );
  }

  private deployShopContract(): Observable<string> {
    const existingContract = localStorage.getItem(SetupShopService.STORAGE_CONTRACT_KEY);
    if (!!existingContract) {
      console.log('Existing contract id found in storage: ' + existingContract);
      return of(existingContract).pipe(
        tap(contractAddr => {
          console.log('Deployed shop contract: ' + contractAddr);
          localStorage.setItem(SetupShopService.STORAGE_CONTRACT_KEY, contractAddr);
        })
      )
    } else {
      // Something like this.
      // this.walletService.deployContract();
      return of("0xe7e07f9dff6b48eba32641c53816f25368297d22").pipe(delay(1500));
    }
  }

  private setupCeramicDocument(contractAddr: string): Observable<CID> {
    const existingShopDocument = localStorage.getItem(SetupShopService.STORAGE_SHOP_DOC_KEY);
    if (!!existingShopDocument) {
      console.log('Existing shop document found in storage: ' + existingShopDocument);
      return of(existingShopDocument).pipe(
        tap(cid => {
          console.log('Created shop config document: ' + cid);
          localStorage.setItem(SetupShopService.STORAGE_SHOP_DOC_KEY, cid);
        })
      );
    } else {
      // Something like this.
      // this.walletService.deployContract();
      return of('CERAMIC_DOCUMENT_ID').pipe(delay(1500));
    }
  }

  private static readonly STORAGE_CONTRACT_KEY = 'SHOP_CONTRACT';
  private static readonly STORAGE_SHOP_DOC_KEY = 'SHOP_CERAMIC_CONFIG';
}
