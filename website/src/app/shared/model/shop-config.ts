import { URI } from "./url";

export type ShopConfigVersion = '1';
export type ShopItemList = {[key: string]: URI};

export interface ShopConfig {
  version: ShopConfigVersion;
}

export interface ShopConfigV1 extends ShopConfig {
  shopName: string;
  currency: string | 'ETH';
  shortDescription: string;
  description: string;
  keywords: string[];
  items: ShopItemList;
}
