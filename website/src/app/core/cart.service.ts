import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

import { ShopItemQuantity } from './identified-item-quantity';
import { ScopedLocalStorage } from './scoped-local-storage.service';
import { ShopError } from './shop-error';
import { ShopItem } from './shop-item';

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

  private findIndexOfItem(itemId: string): number {
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
    try {
      const storedCartStr = this.scopedLocalStorage.getItem(CartService.STORAGE_KEY);
      if (!storedCartStr) {
        return;
      }

      // TODO Check if the items are actually still listed, if not remove them before adding them here.
      const items = this.items.value;
      items.push(...JSON.parse(storedCartStr));
      this.items.next(items);
    } catch (e) {
      // It might be that the shop has not yet resolved or the wallet is not connected. Then
      // an exception throws. This is not the best flow. Would be better when this is handled
      // async.
      return;
    }
  }

  // TODO have a shop scoped local storage to allow multiple carts for the shops
  private static STORAGE_KEY = 'CART';
}
