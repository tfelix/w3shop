import { URL } from 'src/app/shared';
import { Price } from '.';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  detailedDescription: string;
  price: Price;
  mime: string;
  filename: string;
  thumbnails: URL[];
  primaryThumbnail: URL;
  /**
   * Flag that signals if the item is activly sold at the moment.
   */
  isSold: boolean;
}
