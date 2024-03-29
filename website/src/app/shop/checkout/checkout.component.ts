import { Component, OnInit } from '@angular/core';
import { faTrashCan, faAngleLeft, faCreditCard, faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';
import { combineLatest, Observable } from 'rxjs';
import { catchError, map, take } from 'rxjs/operators';

import { ShopError } from 'src/app/core';
import { Price } from 'src/app/blockchain';

import { CartService } from '../cart.service';
import { CheckoutService } from './checkout.service';
import { ShopItemQuantity } from '../identified-item-quantity';
import { IssueService } from '../issue.service';
import { ethers } from 'ethers';

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
  faBuy = faCreditCard;
  faPlus = faPlus;
  faMinus = faMinus;

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
      map(is => is.map(i => this.toCheckoutItem(i))),
      catchError(err => {
        console.warn('There was an error rendering the shopping cart. Purging items for safety.');
        this.cartService.clear();

        throw new ShopError('There was an error rendering the shopping cart.', err);
      })
    );

    this.totalPrice$ = this.items$.pipe(
      map(items => {
        if (items.length === 0) {
          return null;
        } else {
          // Check if all currencies are the same.
          const startCurrency = items[0].priceEach.currency;
          items.slice(1).map(i => i.priceEach.currency).forEach(cur => {
            if (startCurrency != cur) {
              throw new ShopError('Not all currency for this item are equal. This means the shops data is corrupted.');
            }
          });

          const totalPrice = items
            .map(i => ethers.BigNumber.from(i.priceTotal.amount))
            .reduce((prev, current) => prev.add(current), ethers.BigNumber.from(0));

          return { amount: totalPrice.toString(), currency: startCurrency };
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
      console.log('Item(s) buy successful!');
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

    const total = ethers.BigNumber.from(priceEach.amount).mul(quantity).toString();

    return {
      quantity,
      itemId,
      name,
      priceEach,
      priceTotal: { ...priceEach, amount: total },
    };
  }
}
