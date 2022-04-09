import { Injectable } from "@angular/core";

export interface DeploymentState {
  shopConfig?: string;
  shopContract?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ShopDeployStateService {

  registerConfigDeployed(uri: string) {
    localStorage.setItem(ShopDeployStateService.STORAGE_SHOP_CONFIG_KEY, uri);
  }

  registerShopContractDeployed(contractAddress: string) {
    localStorage.setItem(ShopDeployStateService.STORAGE_CONTRACT_KEY, contractAddress);
  }

  getDeploymentState(): DeploymentState {
    return {
      shopConfig: localStorage.getItem(ShopDeployStateService.STORAGE_SHOP_CONFIG_KEY),
      shopContract: localStorage.getItem(ShopDeployStateService.STORAGE_CONTRACT_KEY)
    }
  }

  private static readonly STORAGE_CONTRACT_KEY = 'SHOP_CONTRACT';
  private static readonly STORAGE_SHOP_CONFIG_KEY = 'SHOP_CONFIG';
}