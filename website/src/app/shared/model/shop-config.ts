import { CID } from "./cid";

export type ShopConfigVersion = '1';

export interface ShopConfig {
  version: ShopConfigVersion;
}

export interface ShopConfigV1 extends ShopConfig {
  shopName: string;
  shortDescription: string;
  description: string;
  keywords: string[];
  itemUris: (CID|null)[];
}
