import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, from } from 'rxjs';
import { map, mergeMap, shareReplay, toArray } from 'rxjs/operators';
import { filterNotNull } from '../shared';
import { ShopServiceFactory } from '../shop';

import { ShopItemQuantity } from './identified-item-quantity';
import { ScopedLocalStorage } from './scoped-local-storage.service';
import { ShopError } from './shop-error';
import { ShopItem } from './shop-item';

interface SavedShopItem {
  itemId: string;
  quantity: number;
}

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
    private readonly scopedLocalStorage: ScopedLocalStorage,
    private readonly shopFactory: ShopServiceFactory
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
    // Serialize into a proper format
    const cartItems = this.items.value.map(item => ({ itemId: item.item.id, quantity: item.quantity }));
    const cartItemStr = JSON.stringify(cartItems);
    this.scopedLocalStorage.setItem(CartService.STORAGE_KEY, cartItemStr);
  }

  private loadFromLocalStorage() {
    try {
      const storedCartStr = this.scopedLocalStorage.getItem(CartService.STORAGE_KEY);
      if (!storedCartStr) {
        return;
      }

      const savedItems = JSON.parse(storedCartStr) as SavedShopItem[];

      combineLatest([
        from(savedItems),
        this.shopFactory.getShopService().pipe(
          map(s => s.getItemService()),
          shareReplay(1)
        )
      ]).pipe(
        mergeMap(([savedItem, itemService]) => {
          // TODO Check if the items are actually still listed, if not remove them before adding them here.
          return itemService.getItem(savedItem.itemId).pipe(
            map(shopItem => {
              if (!shopItem) {
                console.warn('ItemService did not find itemId: ' + savedItem.itemId);
                return null;
              } else {
                return { quantity: savedItem.quantity, item: shopItem };
              }
            })
          );
        }),
        filterNotNull(),
        toArray()
      ).subscribe(loadedItems => {
        console.log('CartService loaded saved items: ', loadedItems);
        this.items.next(loadedItems);
      });
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
