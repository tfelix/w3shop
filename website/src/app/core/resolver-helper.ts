import { ShopError } from "./shop-error";
import { SmartContractDetails } from "./shop/shop-identifier.service";

export function exportShopDetails(data: any): SmartContractDetails {
  if (!data.shopDetails) {
    throw new ShopError('No valid shop smart contract was found.');
  }

  return data.shopDetails as SmartContractDetails;
}