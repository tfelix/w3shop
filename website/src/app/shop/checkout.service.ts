import { Injectable } from '@angular/core';
import { BigNumber } from 'ethers';
import { combineLatest, Observable } from 'rxjs';
import { map, mergeMap, pluck, shareReplay, take, tap } from 'rxjs/operators';

import { ShopItemQuantity, CartService } from 'src/app/core';
import { ShopContractService } from 'src/app/blockchain';

import { makeMerkleProof } from './proof-generator';
import { ShopServiceFactory } from './shop-service-factory.service';
import { PaymentProcessorContractService } from '../blockchain/payment-provider-contract.service';

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
    private readonly shopContractService: ShopContractService,
    private readonly paymentProcessorContractService: PaymentProcessorContractService
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
    const shopService$ = this.shopFactory.getShopService();
    const proofIds = items.map(i => BigNumber.from(i.item.id));
    const proofItemPrices = items.map(i => BigNumber.from(i.item.price.amount));
    const amounts = items.map(i => BigNumber.from(i.quantity));

    const allItems$ = shopService$.pipe(
      mergeMap(s => s.getItemService().getItems())
    );

    const smartContractAddress$ = shopService$.pipe(
      pluck('smartContractAddress'),
      shareReplay(1)
    );

    const paymentProcessorAddress$ = smartContractAddress$.pipe(
      mergeMap(sc => this.shopContractService.getPaymentProcessor(sc)),
      shareReplay(1)
    );

    return combineLatest([
      smartContractAddress$,
      paymentProcessorAddress$,
      allItems$
    ]).pipe(
      map(([contractAddr, paymentProcessorAddr, allItems]) => {
        const allItemIds = allItems.map(i => BigNumber.from(i.id));
        const allItemPrices = allItems.map(i => BigNumber.from(i.price.amount));

        return { contractAddr, paymentProcessorAddr, allItemIds, allItemPrices };
      }),
      mergeMap(x => {
        const proof = makeMerkleProof(x.allItemIds, x.allItemPrices, proofIds, proofItemPrices);

        return this.paymentProcessorContractService.buyWithEther(
          x.paymentProcessorAddr,
          x.contractAddr,
          amounts,
          proofItemPrices,
          proofIds,
          proof.proof,
          proof.proofFlags
        );
      }),
      take(1)
    );
  }
}
