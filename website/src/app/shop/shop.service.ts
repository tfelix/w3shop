import { Observable } from "rxjs";

import { Progress } from "src/app/shared";
import { ItemsService } from "./items/items.service";

export interface ShopConfigUpdate {
  shopName: string;
  shortDescription: string;
  description: string;
  keywords: string[];
}

export interface ShopService {
  identifier: string;
  smartContractAddress: string;
  shopName: string;
  shortDescription: string;
  description: string;
  keywords: string[];
  isAdmin: boolean;

  getItemService(): ItemsService;

  /**
   * Reserves the next item IDs. With a central registry we need to reserve this
   * as its unclear which IDs the contract with give us.
   *
   * @param n Number of items to reserve in one batch. Must be bigger than 0.
   */
  getNextItemIds(n: number): Observable<string[]>;

  shopBalance(): Observable<string>;

  addItemUri(itemId: string, itemUri: string);

  updateShopConfigAndRoot();

  /**
   * Updates the shop and the item root with a new configuration.
   *
   * @param update The new configuration of the shop
   */
  update(update: ShopConfigUpdate): Observable<Progress<void>>;

  /**
   * Calculates the current items root and updates the shop contract with
   * the new value.
   * When update() is called this is done automatically. But it might be
   * required to call it on its own e.g. when a TX has failed and the
   * item root is now in an inconstent state.
   */
  updateItemsRoot(): Observable<void>;
  getMerkleRoot(): Observable<string>;
  withdraw(reveiverAddress: string): Observable<void>;
}