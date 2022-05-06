import { Observable } from "rxjs";

// FIXME Those imports should not happen here. Best would be to move shop related code to the shop module
import { Progress } from "src/app/shared";
import { ItemsService } from "src/app/shop";

export interface ShopConfigUpdate {
  shopName: string;
  shortDescription: string;
  description: string;
  keywords: string[];
}

// TODO This might be placed in the shop module instead
export interface ShopService {
  identifier$: Observable<string>;
  smartContractAddress$: Observable<string>;

  shopName$: Observable<string>;
  shortDescription$: Observable<string>;
  description$: Observable<string>;
  keywords$: Observable<string[]>;
  isResolved$: Observable<boolean>;
  isAdmin$: Observable<boolean>;
  items$: Observable<ItemsService>;

  shopBalance(): Observable<string>;

  /**
   * Updates the shop and the item root with a new configuration.
   *
   * @param update The new configuration of the shop
   */
  update(update: ShopConfigUpdate): Observable<Progress>;

  /**
   * Calculates the current items root and updates the shop contract with
   * the new value.
   * When update() is called this is done automatically. But it might be
   * required to call it on its own e.g. when a TX has failed and the
   * item root is now in an inconstent state.
   */
  updateItemsRoot(): Observable<Progress>;
  withdraw(reveiverAddress: string): Observable<void>;
}