import { Injectable, OnInit } from '@angular/core';
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

  constructor() {
    this.loadFromLocalStorage();
  }

  setItemQuantity(item: IdentifiedItem, quantity: number) {
    if (quantity < 0) {
      throw new ShopError('Quantity can not be negative');
    }

    if (quantity === 0) {
      const pos = this.items
        .findIndex(i => i.item.collectionId === item.collectionId && i.item.id === item.id);
      this.items.splice(pos, 1);
    } else {
      this.items.push({ quantity, item });
    }
    this.updateItemCount();
    this.saveToLocalStorage();
  }

  private updateItemCount() {
    let count = 0;

    this.items
      .map(x => x.quantity)
      .forEach(x => count += x);

    this.itemCount.next(count);
  }

  private saveToLocalStorage() {
    const cartItemStr = JSON.stringify(this.items);
    localStorage.setItem(CartService.STORAGE_KEY, cartItemStr);
  }

  private loadFromLocalStorage() {
    const storedCartStr = localStorage.getItem(CartService.STORAGE_KEY);
    this.items.push(...JSON.parse(storedCartStr));
    this.updateItemCount();
  }

  private static STORAGE_KEY = 'cart';
}
