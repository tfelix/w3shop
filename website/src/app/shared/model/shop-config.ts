import { URI } from "./url";

export type ShopConfigVersion = '1';

export interface ShopConfig {
  version: ShopConfigVersion;
}

export interface ShopConfigV1 extends ShopConfig {
  shopName: string;
  currency: string | 'ETH';
  shortDescription: string;
  description: string;
  keywords: string[];
  itemUris: (URI|null)[];
}
