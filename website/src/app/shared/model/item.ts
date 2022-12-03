import { URI } from './url';

export interface Item {
  version: '1';
}

export interface ItemV1 extends Item {
  name: string;
  description: string;
  price: string;
  mime: string;
  filename: string;
  isSold: boolean;
  thumbnails: URI[];
}