import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { IdentifiedItem, Item, ShopError } from '../shared';

interface IdentifiedItemQuantity {
  item: IdentifiedItem,
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private itemCount = new BehaviorSubject<number>(0);

  public readonly itemCount$ = this.itemCount.asObservable();

  private items: IdentifiedItemQuantity[] = [];

  constructor() { }

  addItemToCart(item: IdentifiedItem, quantity: number) {
    this.items.push({ quantity, item });
    this.updateItemCount();
  }

  setQuantity(pos: number, quantity: number) {
    if (pos < 0 || pos >= this.items.length) {
      throw new ShopError('Item index out of bounds');
    }
    if (quantity < 0) {
      throw new ShopError('Quantity can not be negative');
    }

    if (quantity == 0) {
      this.items.splice(pos, 1);
    } else {
      this.items[pos].quantity = quantity;
    }

    this.updateItemCount();
  }

  private updateItemCount() {
    let count = 0;

    this.items
      .map(x => x.quantity)
      .forEach(x => count += x);

    this.itemCount.next(count);
  }
}
