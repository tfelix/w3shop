import { Injectable } from '@angular/core';
import { BigNumber } from 'ethers';
import { forkJoin, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { ShopItemQuantity, ShopContractService, ShopService } from '../core';
import { generateMerkleMultiProof } from './proof-generator';

/**
 * This service uses the content of the shopping cart to build
 * a proof and initiate a smart contract interaction.
 */
@Injectable({
  providedIn: 'root'
})
export class CheckoutService {

  constructor(
    private readonly shopContractService: ShopContractService
  ) { }

  buy(items: ShopItemQuantity[], shopService: ShopService): Observable<void> {
    const proofIds = items.map(i => i.item.id);
    const proofItemPrices = items.map(i => BigNumber.from(i.item.price).toNumber());
    const amounts = items.map(i => i.quantity);

    const itemsObs = shopService.buildItemsService().pipe(mergeMap(is => is.getItems()))

    return forkJoin([
      shopService.smartContractAddress$,
      itemsObs
    ]).pipe(
      map(([contractAddr, items]) => {
        const itemIds = items.map(i => i.id);
        const itemPrices = items.map(i => BigNumber.from(i.price).toNumber());

        return { contractAddr, itemIds, itemPrices };
      }),
      map(x => {
        const proof = generateMerkleMultiProof(x.itemIds, x.itemPrices, proofIds, proofItemPrices);
        this.shopContractService.buy(x.contractAddr, amounts, proofItemPrices, proofIds, proof);
      }),
    );

    // when successful, redirect to the download page that lists the bought files.
    // Or should the component rather redirect?
  }
}
