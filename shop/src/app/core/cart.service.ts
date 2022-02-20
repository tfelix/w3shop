import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { IdentifiedItemQuantity } from './identified-item-quantity';
import { IdentifiedItem, ShopError } from '../shared';
import { map } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class CartService {

  private items = new BehaviorSubject<IdentifiedItemQuantity[]>([]);
  public readonly items$ = this.items.asObservable();

  public readonly itemCount$ = this.items$.pipe(
    map(this.updateItemCount)
  );

  constructor() {
    this.loadFromLocalStorage();
  }

  clear() {
    this.items.next([]);
    this.saveToLocalStorage();
  }

  setItemQuantity(item: IdentifiedItem, quantity: number) {
    if (quantity < 0) {
      throw new ShopError('Quantity can not be negative');
    }

    const items = this.items.value;
    if (quantity === 0) {
      const pos = items.findIndex(i =>
        i.identifiedItem.collectionId === item.collectionId &&
        i.identifiedItem.id === item.id
      );
      items.splice(pos, 1);
    } else {
      items.push({ quantity, identifiedItem: item });
    }

    this.items.next(items);
    this.saveToLocalStorage();
  }

  private updateItemCount(items: IdentifiedItemQuantity[]): number {
    let count = 0;

    items.map(x => x.quantity)
      .forEach(x => count += x);

    return count;
  }

  private saveToLocalStorage() {
    const cartItemStr = JSON.stringify(this.items.value);
    localStorage.setItem(CartService.STORAGE_KEY, cartItemStr);
  }

  private loadFromLocalStorage() {
    const storedCartStr = localStorage.getItem(CartService.STORAGE_KEY);
    if (!storedCartStr) {
      return;
    }

    // TODO Check if the items are actually still listed, if not remove them before adding them here.
    const items = this.items.value;
    items.push(...JSON.parse(storedCartStr));
    this.items.next(items);
  }

  private static STORAGE_KEY = 'CART';
}
