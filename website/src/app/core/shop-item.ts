import { URL } from "../shared";

export interface ShopItem {
  id: number;
  name: string;
  description: string;
  url: string;
  price: string;
  currency: string;
  mime: string;
  thumbnails: URL[];
}
