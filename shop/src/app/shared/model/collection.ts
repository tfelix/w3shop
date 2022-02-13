import { Item } from "./item";

export interface Collection {
  version: string;
}

export interface CollectionV1 extends Collection {
  name: string;
  description: string;
  tags: string[];
  thumbnail: string;
  creationDate: string;
  currency: string;
  totalPrice: string;
  images: [
    {
      url: string;
      description: string;
    }
  ],
  items: (Item | null)[]
}

export interface IdentifiedCollection {
  id: number;
  collection: Collection;
}