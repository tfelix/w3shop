import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: 'root'
})
export class ExistingShopService {

  existingShopUrl: string | null = null;

  constructor() {
    this.checkExistingShopUrl();
  }

  private checkExistingShopUrl() {
    // We always present the DEV mocked shop URL in case we are in development mode
    if (!environment.production) {
      this.existingShopUrl = this.makeUrl(ExistingShopService.DEV_SHOP_URL);
      return;
    }

    const shopId = localStorage.getItem(ExistingShopService.STORAGE_EXISTING_SHOP);
    if (!shopId) {
      return;
    }

    this.existingShopUrl = this.makeUrl(shopId);
  }

  clearExistingShopId() {
    localStorage.removeItem(ExistingShopService.STORAGE_EXISTING_SHOP);
  }

  setExistingShopId(id: string) {
    localStorage.setItem(ExistingShopService.STORAGE_EXISTING_SHOP, id);
  }

  private makeUrl(id: string): string {
    const location = window.location;

    return `${location.protocol}//${location.host}/${id}`;
  }

  private static readonly DEV_SHOP_URL = 'c2M6NDoweEM5ODBmMUIwOTQ3YkIyMTllMjA1NjFDMDA2MjJEODU1NUM4QWIyMDQ';
  private static readonly STORAGE_EXISTING_SHOP = 'EXISTING_SHOP';
}