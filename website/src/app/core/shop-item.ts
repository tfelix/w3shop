import { URL } from 'src/app/shared';
import { Price } from '../shop';

export interface ShopItem {
  id: number;
  name: string;
  description: string;
  price: Price;
  mime: string;
  thumbnails: URL[];
  primaryThumbnail: URL;
}
