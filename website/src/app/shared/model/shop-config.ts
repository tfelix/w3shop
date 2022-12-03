import { URI } from './url';

export type ShopConfigVersion = '1';
export type ShopItemList = { [key: string]: URI };

export interface ShopConfig {
  version: ShopConfigVersion;
}

export interface ShopConfigV1 extends ShopConfig {
  /**
   * Name of the shop
   */
  shopName: string;

  /**
   * Currency token address the shop wants to receive. 0x0 means the shop
   * accepts ETH.
   */
  currency: string;

  /**
   * Contains information about the shops contract.
   */
  contract: {
    address: string;
    chainId: number;
  }

  /**
   * A short description of the shop often used as summary or tag-line.
   */
  shortDescription: string;

  /**
   * Longer descrpition of the shop can be formatted as Markdown.
   */
  description: string;

  /**
   * A list of keywords that describe the contents of your shop.
   */
  keywords: string[];

  /**
   * The list of the items this shop sells.
   */
  items: ShopItemList;
}
