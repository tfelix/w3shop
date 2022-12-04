import { URI } from './url';

export interface Item {
  version: '1';
}

export interface ItemV1 extends Item {
  /**
   * Name of the item.
   *
   * Max length: 50 chars
   */
  name: string;

  /**
   * Short description of what is sold.
   *
   * Max length: 200 chars
   */
  description: string;
  detailedDescription: string;
  price: string;
  mime: string;
  filename: string;
  isSold: boolean;
  thumbnails: URI[];
}