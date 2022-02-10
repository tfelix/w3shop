export interface Item {
  version: 1
}

export interface ItemV1 extends Item {
  description: string;
  url: string;
  currency: string;
  price: string;
  mime: string;
}