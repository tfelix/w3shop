import { ShopError } from "..";
import { CID } from "./cid";

export interface ShopConfig {
  version: string;
}

export interface ShopConfigV1 extends ShopConfig {
  shopName: string;
  shopSmartContract: string;
  chainId: string;
  shortDescription: string;
  description: string;
  owner: string; // NFT Identifier of the shop owner.
  keywords: string[];
  collectionUris: (CID|null)[];
}

export function sanitizeConfig(c: ShopConfig): ShopConfig {
  if (c.version == '1') {
    const c1 = c as ShopConfigV1;
    return {
      ...c1,
      shopName: c1.shopName.slice(0, 50),
      shortDescription: c1.shortDescription.slice(0, 160)
    } as ShopConfig;
  } else {
    throw new ShopError('Unknown config version: ' + c.version);
  }
}