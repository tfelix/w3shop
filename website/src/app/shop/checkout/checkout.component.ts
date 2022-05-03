import { Component } from '@angular/core';

import { faTrashCan, faAngleLeft } from '@fortawesome/free-solid-svg-icons';
import { forkJoin, Observable } from 'rxjs';
import { map, mergeMap, take, tap } from 'rxjs/operators';
import { CartService, ShopServiceFactory, ShopItemQuantity, IssueService } from 'src/app/core';
import { Price, sumPrices, toPrice } from '..';
import { CheckoutService } from '../checkout.service';

interface CheckoutItem {
  quantity: number;
  itemId: number;
  name: string;
  priceEach: Price;
  priceTotal: Price;
}

@Component({
  selector: 'w3s-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent {

  faTrashCan = faTrashCan;
  faAngleLeft = faAngleLeft;

  readonly itemCount$: Observable<number>;
  readonly items$: Observable<CheckoutItem[]>;
  readonly totalPrice$: Observable<Price | null>;
  readonly hasRootMismatch$: Observable<boolean>;

  readonly canBuy$: Observable<boolean>;

  constructor(
    private readonly cartService: CartService,
    private readonly checkoutService: CheckoutService,
    private readonly issueService: IssueService,
  ) {
    this.itemCount$ = this.cartService.itemCount$;
    this.items$ = this.cartService.items$.pipe(
      map(is => is.map(i => this.toCheckoutItem(i)))
    );
    this.totalPrice$ = this.items$.pipe(
      map(items => {
        if (items.length === 0) {
          return null;
        } else {
          return sumPrices(items.map(i => i.priceTotal));
        }
      })
    );

    const hasMerkleRootIssue = this.issueService.issues$.pipe(map(x => x.merkleRootIssue !== null));

    this.canBuy$ = forkJoin([
      this.items$,
      hasMerkleRootIssue,
    ]).pipe(
      map(([items, rootIssue]) => items.length > 0 && !rootIssue)
    )
  }

  removeItem(itemId: number) {
    // this.cartService.setItemQuantity();
    // This might not be required anymore when we later switch to item-id only setup and
    // consolidate the item handling.
    this.cartService.items$.pipe(
      take(1),
      map(x => x.filter(i => i.item.id == itemId))
    ).subscribe(item => {
      this.cartService.setItemQuantity(item[0].item, 0);
    });
  }

  incrementItemQuantity(itemId: number) {
    this.findItem(itemId).subscribe(x => this.cartService.addItemQuantity(x.item, 1));
  }

  decrementItemQuantity(itemId: number) {
    this.findItem(itemId).subscribe(x => this.cartService.addItemQuantity(x.item, -1));
  }

  checkout() {
    this.checkoutService.buy().subscribe(() => {
      // TODO add some success animation and show download possibilities of new items
    });
  }

  private findItem(itemId: number): Observable<ShopItemQuantity> {
    return this.cartService.items$.pipe(
      take(1),
      map(x => x.filter(i => i.item.id == itemId)[0])
    );
  }

  private toCheckoutItem(iiq: ShopItemQuantity): CheckoutItem {
    const quantity = iiq.quantity;
    const item = iiq.item;
    const itemId = item.id;
    const name = item.name;
    const priceEach = toPrice(item);
    const total = priceEach.price.mul(quantity);

    return {
      quantity,
      itemId,
      name,
      priceEach,
      priceTotal: { ...priceEach, price: total },
    };
  }
}
