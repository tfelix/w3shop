import { Injectable } from '@angular/core';
import { BigNumber } from 'ethers';
import { forkJoin, Observable } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';

import { ShopItemQuantity, ShopContractService, CartService, ShopServiceFactory } from 'src/app/core';

import { generateMerkleMultiProof } from './proof-generator';

/**
 * This service uses the content of the shopping cart to build
 * a proof and initiate a smart contract interaction.
 */
@Injectable({
  providedIn: 'root'
})
export class CheckoutService {

  /**
   * Holds the items that were bought in the last successful buy() call.
   * Can be used to display the download overview screen after a user bought something.
   */
  public recentlyPurchased: ShopItemQuantity[] = [];

  constructor(
    private readonly cartService: CartService,
    private readonly shopFactory: ShopServiceFactory,
    private readonly shopContractService: ShopContractService
  ) { }

  buy(): Observable<ShopItemQuantity[]> {
    return this.cartService.items$.pipe(
      // we want the items later in the tap call.
      mergeMap(items => this.buyItems(items).pipe(map((_) => (items)))),
      tap(items => {
        this.recentlyPurchased = items;
        this.cartService.clear();
      })
    );
  }

  private buyItems(items: ShopItemQuantity[]): Observable<void> {
    const shopService = this.shopFactory.build();
    const proofIds = items.map(i => BigNumber.from(i.item.id));
    const proofItemPrices = items.map(i => BigNumber.from(i.item.price));
    const amounts = items.map(i => BigNumber.from(i.quantity));

    const itemsObs = shopService.items$.pipe(mergeMap(is => is.getItems()))

    return forkJoin([
      shopService.smartContractAddress$,
      itemsObs
    ]).pipe(
      map(([contractAddr, items]) => {
        const itemIds = items.map(i => BigNumber.from(i.id));
        const itemPrices = items.map(i => BigNumber.from(i.price));

        return { contractAddr, itemIds, itemPrices };
      }),
      mergeMap(x => {
        const proof = generateMerkleMultiProof(x.itemIds, x.itemPrices, proofIds, proofItemPrices);

        return this.shopContractService.buy(x.contractAddr, amounts, proofItemPrices, proofIds, proof);
      })
    );
  }
}
