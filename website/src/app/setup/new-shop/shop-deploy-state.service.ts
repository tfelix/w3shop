import { Injectable } from '@angular/core';
import { BasicShopInfo } from './step-basic-info/step-basic-info.component';
import { Marketplace } from './step-marketplace/step-marketplace.component';

export interface ShopDeploymentInfo {
  salt: string;
  usedWalletAddress: string;
  shopContractAddress: string;
  shopIdentifier: string;
  shopConfigUri?: string;
};

@Injectable({
  providedIn: 'root'
})
export class ShopDeployStateService {

  hasBasicInformation(): boolean {
    return localStorage.getItem(ShopDeployStateService.STORAGE_SHOP_BASIC_INFO) !== null;
  }

  registerBasicShopInfo(data: BasicShopInfo) {
    localStorage.setItem(ShopDeployStateService.STORAGE_SHOP_BASIC_INFO, JSON.stringify(data));
  }

  getBasicInfo(): BasicShopInfo | null {
    const data = localStorage.getItem(ShopDeployStateService.STORAGE_SHOP_BASIC_INFO);

    if (!data) {
      return null;
    }

    return JSON.parse(data);
  }

  clearBasicInformation(): void {
    localStorage.removeItem(ShopDeployStateService.STORAGE_SHOP_BASIC_INFO);
  }

  hasMarketplace(): boolean {
    return localStorage.getItem(ShopDeployStateService.STORAGE_SHOP_MARKETPLACE) !== null;
  }

  registerMarketplace(data: Marketplace) {
    localStorage.setItem(ShopDeployStateService.STORAGE_SHOP_MARKETPLACE, JSON.stringify(data));
  }

  getMarketplace(): Marketplace | null {
    const data = localStorage.getItem(ShopDeployStateService.STORAGE_SHOP_MARKETPLACE);

    if (!data) {
      return null;
    }

    return JSON.parse(data);
  }

  clearMarketplace(): void {
    localStorage.removeItem(ShopDeployStateService.STORAGE_SHOP_MARKETPLACE);
  }

  registerShopDeploymentInfo(data: ShopDeploymentInfo) {
    localStorage.setItem(ShopDeployStateService.STORAGE_SHOP_DEPLOY_INFO, JSON.stringify(data));
  }

  getShopDeploymentInfo(): ShopDeploymentInfo | null {
    const data = localStorage.getItem(ShopDeployStateService.STORAGE_SHOP_DEPLOY_INFO);

    if (!data) {
      return null;
    }

    return JSON.parse(data);
  }

  clearShopDeploymentInfo() {
    localStorage.removeItem(ShopDeployStateService.STORAGE_SHOP_DEPLOY_INFO);
  }

  registerMarketplaceConfigUri(uri: string) {
    localStorage.setItem(ShopDeployStateService.STORAGE_MARKETPLACE_URI, uri);
  }

  getMarketplaceConfigUri(): string | null {
    return localStorage.getItem(ShopDeployStateService.STORAGE_MARKETPLACE_URI);
  }

  clearMarketplaceConfigUri() {
    localStorage.removeItem(ShopDeployStateService.STORAGE_MARKETPLACE_URI);
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

  /**
   * Clears all the data that is connected to a shop deployment.
   * - Form data
   * - Config Arweave URI
   */
  clearAllDeploymentData() {
    this.clearShopDeploymentInfo();
    this.clearBasicInformation();
    this.clearMarketplace();
    this.clearMarketplaceConfigUri();
  }

  private static readonly STORAGE_SHOP_BASIC_INFO = 'SHOP_BASIC_INFO';
  private static readonly STORAGE_SHOP_DEPLOY_INFO = 'SHOP_DEPLOY_INFO';
  private static readonly STORAGE_SHOP_MARKETPLACE = 'SHOP_MARKETPLACE';
  private static readonly STORAGE_SHOP_IDENTIFIER = 'SHOP_IDENTIFIER';
  private static readonly STORAGE_MARKETPLACE_URI = 'SHOP_MARKETPLACE_URI';
}