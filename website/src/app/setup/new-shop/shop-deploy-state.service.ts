import { Injectable } from "@angular/core";

export interface DeploymentState {
  shopConfig?: string;
  shopContract?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ShopDeployStateService {

  registerConfigDeployed(uri?: string) {
    if (!uri) {
      return;
    }
    localStorage.setItem(ShopDeployStateService.STORAGE_SHOP_CONFIG_KEY, uri);
  }

  registerShopContractDeployed(contractAddress?: string) {
    if (!contractAddress) {
      return;
    }
    localStorage.setItem(ShopDeployStateService.STORAGE_CONTRACT_KEY, contractAddress);
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
      shopContract: localStorage.getItem(ShopDeployStateService.STORAGE_CONTRACT_KEY)
    }
  }

  getShopContractAddress(): string | null {
    return localStorage.getItem(ShopDeployStateService.STORAGE_CONTRACT_KEY);
  }

  clear(clearWithContract: boolean = false) {
    localStorage.removeItem(ShopDeployStateService.STORAGE_SHOP_CONFIG_KEY);
    if (clearWithContract) {
      localStorage.removeItem(ShopDeployStateService.STORAGE_CONTRACT_KEY);
    }
  }

  private makeUrl(shopIdentifier: string): string {
    const location = window.location;

    return `${location.protocol}//${location.host}/${shopIdentifier}`;
  }

  private static readonly STORAGE_CONTRACT_KEY = 'SHOP_CONTRACT';
  private static readonly STORAGE_SHOP_CONFIG_KEY = 'SHOP_CONFIG';
}