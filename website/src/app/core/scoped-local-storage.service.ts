import { Injectable } from '@angular/core';

/**
 * Provides an interface for a local storage, however
 * it is scoped to the current resolved shop instance. Enables
 * to use multiple shopping carts for different shops for example.
 */
@Injectable({
  providedIn: 'root'
})
export class ScopedLocalStorage {

  private shopIdentifier: string | null = null;

  constructor() {
  }

  setShopIdentifier(shopIdentifier: string) {
    this.shopIdentifier = shopIdentifier;
  }

  /**
   * Clears only the items for the current shop.
   */
  clear() {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      keys.push(localStorage.key(i));
    }

    const keysToRemove = keys.filter(x => x.startsWith(this.shopIdentifier));
    keysToRemove.forEach(k => localStorage.removeItem(k));
  }

  getItem(key: string): string | null {
    return localStorage.getItem(this.buildScopedKey(key));
  }

  removeItem(key: string) {
    localStorage.removeItem(this.buildScopedKey(key));
  }

  setItem(key: string, value: string) {
    localStorage.setItem(this.buildScopedKey(key), value);
  }

  private buildScopedKey(key: string): string {
    return `${this.shopIdentifier}-${key}`;
  }
}