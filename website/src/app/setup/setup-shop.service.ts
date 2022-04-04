import { Inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';

import { base64UrlEncode, CID, ShopConfigV1 } from 'src/app/shared';
import { DeployResult, DeployContractService } from './new-shop/contract-deploy.service';
import { NewShop } from './new-shop/new-shop';

@Injectable({
  providedIn: 'root'
})
export class SetupShopService {

  constructor(
    private readonly blockchainService: DeployContractService,
    // @Inject('Database') private readonly databaseService: DatabaseService,
  ) { }

  createShop(newShop: NewShop): Observable<string> {
    return this.deployShopContract().pipe(
      mergeMap(deployResult => this.setupCeramicDocument(deployResult, newShop)),
      map(cid => base64UrlEncode(cid))
    );
  }

  private deployShopContract(): Observable<DeployResult> {
    // First check if there is already an existing contract. We can then also short circuit the
    // new shop form because this would mean there is also shop data.
    const existingContractStr = localStorage.getItem(SetupShopService.STORAGE_CONTRACT_KEY);

    if (!!existingContractStr) {
      console.log('Existing contract id found in storage: ' + existingContractStr);
      try {
        return of(JSON.parse(existingContractStr) as DeployResult);
      } catch (e) {
        console.error('Could not parse saved shop config, skipping.', e);
      }
    }

    return this.blockchainService.deployShopContract().pipe(
      tap(deployResult => {
        console.log('Deployed shop contract: ' + deployResult);
        localStorage.setItem(SetupShopService.STORAGE_CONTRACT_KEY, JSON.stringify(deployResult));
      })
    )
  }

  private setupCeramicDocument(
    deployResult: DeployResult,
    newShop: NewShop
  ): Observable<CID> {
    const shopConfig: ShopConfigV1 = {
      shopName: newShop.shopName,
      // shopSmartContract: deployResult.contractAddr,
      // chainId: newShop.chainId,
      shortDescription: newShop.shortDescription,
      description: newShop.description,
      keywords: newShop.keywords,
      itemUris: [],
      version: '1'
    }

    const existingShopDocument = localStorage.getItem(SetupShopService.STORAGE_SHOP_DOC_KEY);
    if (!!existingShopDocument) {
      console.log('Existing shop document found in storage: ' + existingShopDocument);
      return of(existingShopDocument);
    } else {
      throw new Error('not implemented');
      /* FIXME
      return this.databaseService.saveShopConfig(shopConfig).pipe(
        tap(cid => {
          console.log('Created shop config document: ' + cid);
          localStorage.setItem(SetupShopService.STORAGE_SHOP_DOC_KEY, cid);
        })
      );
*/
    }
  }

  private static readonly STORAGE_CONTRACT_KEY = 'SHOP_CONTRACT';
  private static readonly STORAGE_SHOP_DOC_KEY = 'SHOP_CERAMIC_CONFIG';
}
