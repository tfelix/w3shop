import { Injectable } from "@angular/core";
import { NewShopData } from "./new-shop-data";

@Injectable({
  providedIn: 'root'
})
export class ShopDeployStateService {

  registerShopConfig(uri: string) {
    localStorage.setItem(ShopDeployStateService.STORAGE_SHOP_CONFIG_KEY, uri);
  }

  getShopConfig(): string | null {
    return localStorage.getItem(ShopDeployStateService.STORAGE_SHOP_CONFIG_KEY);
  }

  clearShopConfig() {
    localStorage.removeItem(ShopDeployStateService.STORAGE_SHOP_CONFIG_KEY);
  }

  registerShopIdentifier(shopIdentifier: string) {
    localStorage.setItem(ShopDeployStateService.STORAGE_SHOP_IDENTIFIER, shopIdentifier);
  }

  getShopIdentifier(): string | null {
    return localStorage.getItem(ShopDeployStateService.STORAGE_SHOP_IDENTIFIER);
  }

  clearShopIdentifier() {
    localStorage.removeItem(ShopDeployStateService.STORAGE_SHOP_IDENTIFIER);
  }

  registerNewShopFormData(data: NewShopData) {
    localStorage.setItem(ShopDeployStateService.STORAGE_SHOP_DATA, JSON.stringify(data));
  }

  getNewShopFormData(): NewShopData | null {
    const data = localStorage.getItem(ShopDeployStateService.STORAGE_SHOP_DATA);
    if (!data) {
      return null;
    } else {
      return JSON.parse(data);
    }
  }

  clearNewShopFormData() {
    localStorage.removeItem(ShopDeployStateService.STORAGE_SHOP_DATA);
  }

  /**
   * Clears all the data that is connected to a shop deployment.
   * - Form
   * - Config Arweave URI
   */
  clearShopDeploymentData() {
    this.clearNewShopFormData();
    this.clearShopConfig();
  }

  private static readonly STORAGE_SHOP_IDENTIFIER = 'SHOP_IDENTIFIER';
  private static readonly STORAGE_SHOP_CONFIG_KEY = 'SHOP_CONFIG';
  private static readonly STORAGE_SHOP_DATA = 'SHOP_DATA';
}