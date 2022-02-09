export interface ShopConfig {
  version: string;
}

export interface ShopConfigV1 extends ShopConfig {
  shopName: string;
  shopSmartContract: string;
  chainId: string;
  description: string;
  owner: string;
  keywords: string[];
  collectionUris: string[];
}