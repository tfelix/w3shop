import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Collection, Item } from '../shared';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private itemCount = new BehaviorSubject<number>(0);

  public readonly itemCount$ = this.itemCount.asObservable();

  private collections: Collection[] = [];
  private items: Item[] = [];

  constructor() { }

  addCollectionToCart(collection: Collection) {
    this.updateItemCount();
  }

  addItemToCart(item: Item) {
    this.updateItemCount();
  }

  removeFromCart(pos: number) {
    this.updateItemCount();
  }

  private updateItemCount() {
    this.itemCount.next(this.collections.length + this.items.length);
  }
}
