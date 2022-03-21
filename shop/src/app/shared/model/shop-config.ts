import { CID } from "./cid";

export type ShopConfigVersion = '1';

export interface ShopConfig {
  version: ShopConfigVersion;
}

// TODO It could make sense to split the config between mutable and immutable parts to make sure relevant parts e.g. like smart contract ID can never
// be manipulated. Possibly save in Arweave as soon as I have a good opportunity to use Arweave directly from JS.
export interface ShopConfigV1 extends ShopConfig {
  shopSmartContract: string;
  chainId: string;

  shopName: string;
  shortDescription: string;
  description: string;
  keywords: string[];
  itemsUris: (CID|null)[];
}
