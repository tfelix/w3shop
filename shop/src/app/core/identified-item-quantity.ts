import { IdentifiedData, Item } from "../shared";

export interface IdentifiedItemQuantity {
  identifiedItem: IdentifiedData<Item>,
  quantity: number;
}
