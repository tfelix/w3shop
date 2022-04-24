import { Injectable } from "@angular/core";
import { NewShopData } from "./new-shop-data";

export interface DeploymentState {
  shopConfig?: string;
  shopContract?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ShopDeployStateService {

  registerShopConfig(uri?: string) {
    if (!uri) {
      return;
    }
    localStorage.setItem(ShopDeployStateService.STORAGE_SHOP_CONFIG_KEY, uri);
  }

  registerShopContract(shopIdentifier?: string) {
    if (!shopIdentifier) {
      return;
    }
    localStorage.setItem(ShopDeployStateService.STORAGE_SHOP_IDENTIFIER, shopIdentifier);
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

  getExistingShopUrl(): string | null {
    const shopContract = this.getDeploymentState().shopContract;
    if (!shopContract) {
      return null;
    }

    // FIXME turn contract id into proper link.
    return this.makeUrl(shopContract);
  }

  getDeploymentState(): DeploymentState {
    return {
      shopConfig: localStorage.getItem(ShopDeployStateService.STORAGE_SHOP_CONFIG_KEY),
      shopContract: localStorage.getItem(ShopDeployStateService.STORAGE_SHOP_IDENTIFIER)
    }
  }

  getShopContractAddress(): string | null {
    return localStorage.getItem(ShopDeployStateService.STORAGE_SHOP_IDENTIFIER);
  }

  clearShopContract() {
    localStorage.removeItem(ShopDeployStateService.STORAGE_SHOP_IDENTIFIER);
  }

  clearShopConfig() {
    localStorage.removeItem(ShopDeployStateService.STORAGE_SHOP_CONFIG_KEY);
  }

  private makeUrl(shopIdentifier: string): string {
    const location = window.location;

    return `${location.protocol}//${location.host}/${shopIdentifier}`;
  }

  private static readonly STORAGE_SHOP_IDENTIFIER = 'SHOP_IDENTIFIER';
  private static readonly STORAGE_SHOP_CONFIG_KEY = 'SHOP_CONFIG';
  private static readonly STORAGE_SHOP_DATA = 'SHOP_DATA';
}