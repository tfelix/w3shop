import { Inject, Injectable } from "@angular/core";
import { ShopError } from "./shop-error";
import { ShopService } from "./shop/shop.service";

/**
 * Provides an interface for a local storage, however
 * it is scoped to the current resolved shop instance. Enables
 * to use multiple shopping carts for different shops for example.
 */
@Injectable({
  providedIn: 'root'
})
export class ScopedLocalStorage {

  private shopIdentifier = null;

  constructor(
    @Inject('Shop') private readonly shopService: ShopService
  ) {
    this.shopService.identifier$
      .subscribe(x => this.shopIdentifier = x);
  }

  /**
   * Clears only the items for the current shop.
   */
  clear() {
    if (this.shopIdentifier === null) {
      throw new ShopError('Shop has not resolved');
    }

    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      keys.push(localStorage.key(i));
    }

    const keysToRemove = keys.filter(x => x.startsWith(this.shopIdentifier));
    keysToRemove.forEach(k => localStorage.removeItem(k));
  }

  getItem(key: string): string {
    return localStorage.getItem(this.buildScopedKey(key));
  }

  removeItem(key: string) {
    localStorage.removeItem(this.buildScopedKey(key));
  }

  setItem(key: string, value: string) {
    localStorage.setItem(this.buildScopedKey(key), value);
  }

  private buildScopedKey(key: string): string {
    if (this.shopIdentifier === null) {
      throw new ShopError('Shop has not resolved');
    }

    return `${this.shopIdentifier}-${key}`;
  }
}