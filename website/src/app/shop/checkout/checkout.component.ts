import { Component, OnInit } from '@angular/core';

import { faTrashCan, faAngleLeft } from '@fortawesome/free-solid-svg-icons';
import { combineLatest, Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { CartService } from '../cart.service';
import { CheckoutService } from '../checkout.service';
import { ShopItemQuantity } from '../identified-item-quantity';
import { IssueService } from '../issue.service';
import { Price, sumPrices } from '../price/price';

interface CheckoutItem {
  quantity: number;
  itemId: string;
  name: string;
  priceEach: Price;
  priceTotal: Price;
}

@Component({
  selector: 'w3s-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit {

  faTrashCan = faTrashCan;
  faAngleLeft = faAngleLeft;

  itemCount$: Observable<number>;
  items$: Observable<CheckoutItem[]>;
  totalPrice$: Observable<Price | null>;
  hasRootMismatch$: Observable<boolean>;

  canBuy$: Observable<boolean>;

  constructor(
    private readonly cartService: CartService,
    private readonly checkoutService: CheckoutService,
    private readonly issueService: IssueService,
  ) {

  }

  ngOnInit(): void {
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

    this.canBuy$ = combineLatest([
      this.items$,
      hasMerkleRootIssue,
    ]).pipe(
      map(([items, rootIssue]) => items.length > 0 && !rootIssue),
    );
  }

  removeItem(itemId: string) {
    // This might not be required anymore when we later switch to item-id only setup and
    // consolidate the item handling.
    this.cartService.items$.pipe(
      take(1),
      map(x => x.filter(i => i.item.id == itemId))
    ).subscribe(item => {
      this.cartService.setItemQuantity(item[0].item, 0);
    });
  }

  incrementItemQuantity(itemId: string) {
    this.findItem(itemId).subscribe(x => this.cartService.addItemQuantity(x.item, 1));
  }

  decrementItemQuantity(itemId: string) {
    this.findItem(itemId).subscribe(x => this.cartService.addItemQuantity(x.item, -1));
  }

  checkout() {
    this.checkoutService.buy().subscribe(() => {
      console.log('Item(s) buy successful');
      // TODO add some success animation and show download possibilities of new items
    });
  }

  private findItem(itemId: string): Observable<ShopItemQuantity> {
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
    const priceEach = item.price;
    const total = priceEach.amount.mul(quantity);

    return {
      quantity,
      itemId,
      name,
      priceEach,
      priceTotal: { ...priceEach, amount: total },
    };
  }
}
