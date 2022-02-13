export interface Item {
  version: string;
}

export interface ItemV1 extends Item {
  name: string;
  description: string;
  url: string;
  currency: string;
  price: string;
  mime: string;
}

export interface IdentifiedItem {
  id: number;
  collectionId: number;
  item: Item;
}