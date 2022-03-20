import { CID } from "./cid";

export type ShopConfigVersion = '1';

export interface ShopConfig {
  version: ShopConfigVersion;
}

// TODO It could make sense to split the config between mutable and immutable parts to make sure relevant parts e.g. like smart contract ID can never
// be manipulated.
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
