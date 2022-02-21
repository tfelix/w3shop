import { Component } from '@angular/core';

import { faTrashCan, faAngleLeft } from '@fortawesome/free-solid-svg-icons';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { CartService, IdentifiedItemQuantity } from 'src/app/core';
import { CollectionV1, ItemV1, ShopError } from 'src/app/shared';
import { Price, sumPrices, toPrice } from '..';
import { CollectionsService } from '../collections.service';

interface CheckoutItem {
  quantity: number;
  collectionId: number;
  imageUrl$: Observable<string>;
  collectionName$: Observable<string>;
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
  readonly totalPrice$: Observable<Price>;

  constructor(
    private readonly cartService: CartService,
    private readonly collectionService: CollectionsService
  ) {
    this.itemCount$ = this.cartService.itemCount$;
    this.items$ = this.cartService.items$.pipe(
      map(is => is.map(i => this.toCheckoutItem(i)))
    );
    this.totalPrice$ = this.items$.pipe(
      map(items => sumPrices(items.map(i => i.priceTotal)))
    );
  }

  removeItem(collectionId: number, itemId: number) {
    // this.cartService.setItemQuantity();
    // This might not be required anymore when we later switch to item-id only setup and
    // consolidate the item handling.
    this.cartService.items$.pipe(
      take(1),
      map(x => x.filter(i => i.identifiedItem.collectionId == collectionId && i.identifiedItem.id == itemId))
    ).subscribe(item => {
      this.cartService.setItemQuantity(item[0].identifiedItem, 0);
    });
  }

  private toCheckoutItem(iiq: IdentifiedItemQuantity): CheckoutItem {
    const quantity = iiq.quantity;
    const collectionId = iiq.identifiedItem.collectionId;
    const itemId = iiq.identifiedItem.id;
    const item = iiq.identifiedItem.item;

    if (item.version == '1') {
      const itemV1 = item as ItemV1;
      const name = itemV1.name;

      const collection$ = this.collectionService.getCollection(collectionId).pipe(
        map(c => (c != null) ? c.collection as CollectionV1 : null)
      );

      const collectionName$ = collection$.pipe(
        map(c => c.name)
      );

      const imageUrl$ = collection$.pipe(
        map(c => c.images[0].url)
      );

      // Very clunky price handling design. Try to rework this sooner or later.
      // Its also not good to "tunnel" the whole item into the shopping cart local storage.
      // Better would be to only keep the IDs of collection/item (even better: only use itemIds, and assign those to collections later via IDs).
      const priceEach = toPrice(itemV1);
      const total = priceEach.price.mul(quantity);

      return {
        quantity,
        collectionId,
        itemId,
        name,
        collectionName$,
        priceEach,
        imageUrl$,
        priceTotal: { ...priceEach, price: total },
      };
    } else {
      throw new ShopError('Unknown Item version: ' + item.version);
    }
  }
}
