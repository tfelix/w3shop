import { URI } from "../shared";

export interface ShopItem {
  id: number;
  name: string;
  description: string;
  price: string;
  currency: string;
  mime: string;
  thumbnails: URI[];
}
