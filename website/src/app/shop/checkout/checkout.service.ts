import { Injectable } from '@angular/core';
import { BigNumber } from 'ethers';
import { combineLatest, Observable } from 'rxjs';
import { delayWhen, map, mergeMap, pluck, share, take, tap } from 'rxjs/operators';

import { ShopContractService } from 'src/app/blockchain';

import { makeMerkleProof } from '../proof/proof-generator';
import { ShopServiceFactory } from '../shop-service-factory.service';
import { PaymentProcessorContractService } from '../../blockchain/payment-provider-contract.service';
import { ShopItemQuantity } from '../identified-item-quantity';
import { CartService } from '../cart.service';

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
      // We must only take one otherwise this will re-trigger the whole buy process
      // as an infinite loop as we reset the cart service at the end of the buy process.
      take(1),
      delayWhen(items => this.buyItems(items)),
      tap(items => {
        console.log('Buy success');
        this.recentlyPurchased = items;
        this.cartService.clear();
      }),
      share()
    );
  }

  private buyItems(items: ShopItemQuantity[]): Observable<void> {
    console.log('Buying items: ', items);

    const shopService$ = this.shopFactory.getShopService();
    const proofIds = items.map(i => BigNumber.from(i.item.id));
    const proofItemPrices = items.map(i => BigNumber.from(i.item.price.amount));
    const amounts = items.map(i => BigNumber.from(i.quantity));

    const allItems$ = shopService$.pipe(
      mergeMap(s => s.getItemService().getItems()),
    );

    const smartContractAddress$ = shopService$.pipe(
      pluck('smartContractAddress'),
    );

    const paymentProcessorAddress$ = smartContractAddress$.pipe(
      mergeMap(sc => this.shopContractService.getPaymentProcessor(sc)),
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
      share()
    );
  }
}
