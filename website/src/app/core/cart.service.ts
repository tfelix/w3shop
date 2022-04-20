import { Injectable, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Item, ShopItem } from '../shared';

import { ShopItemQuantity } from './identified-item-quantity';
import { ShopError } from './shop-error';

import { ScopedLocalStorage } from 'src/app/core';


@Injectable({
  providedIn: 'root'
})
export class CartService {

  private items = new BehaviorSubject<ShopItemQuantity[]>([]);
  public readonly items$ = this.items.asObservable();

  public readonly itemCount$ = this.items$.pipe(
    map(this.updateItemCount)
  );

  constructor(
    private readonly scopedLocalStorage: ScopedLocalStorage
  ) {
    this.loadFromLocalStorage();
  }

  clear() {
    this.items.next([]);
    this.saveToLocalStorage();
  }

  setItemQuantity(item: ShopItem, quantity: number) {
    if (quantity < 0) {
      throw new ShopError('Quantity can not be negative');
    }

    const items = this.items.value;
    if (quantity === 0) {
      const pos = this.findIndexOfItem(item.id);
      if (pos === -1) {
        throw new ShopError('Item was not found in cart');
      }
      items.splice(pos, 1);
    } else {
      const pos = this.findIndexOfItem(item.id);
      if (pos === -1) {
        items.push({ quantity, item: item });
      } else {
        items[pos].quantity = quantity;
      }
    }

    this.items.next(items);
    this.saveToLocalStorage();
  }

  addItemQuantity(item: ShopItem, quantity: number) {
    const pos = this.findIndexOfItem(item.id);
    const items = this.items.value;
    if (pos === -1) {
      this.setItemQuantity(item, quantity);
    } else {
      const newQuantity = items[pos].quantity + quantity;
      this.setItemQuantity(item, newQuantity);
    }
  }

  private findIndexOfItem(itemId: number): number {
    return this.items.value.findIndex(i =>
      i.item.id === itemId
    );
  }

  private updateItemCount(items: ShopItemQuantity[]): number {
    let count = 0;

    items.map(x => x.quantity)
      .forEach(x => count += x);

    return count;
  }

  private saveToLocalStorage() {
    const cartItemStr = JSON.stringify(this.items.value);
    this.scopedLocalStorage.setItem(CartService.STORAGE_KEY, cartItemStr);
  }

  private loadFromLocalStorage() {
    const storedCartStr = this.scopedLocalStorage.getItem(CartService.STORAGE_KEY);
    if (!storedCartStr) {
      return;
    }

    // TODO Check if the items are actually still listed, if not remove them before adding them here.
    const items = this.items.value;
    items.push(...JSON.parse(storedCartStr));
    this.items.next(items);
  }

  // TODO have a shop scoped local storage to allow multiple carts for the shops
  private static STORAGE_KEY = 'CART';
}
