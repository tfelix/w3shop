import { Observable } from "rxjs";
import { ShopConfigV1 } from "src/app/shared";
import { ItemsService } from "src/app/shop";

// TODO This might be placed in the shop module instead
export interface ShopFacade {
  identifier$: Observable<string>;
  smartContractAddress$: Observable<string>;
  shopName$: Observable<string>;
  shortDescription$: Observable<string>;
  description$: Observable<string>;
  keywords$: Observable<string[]>;
  isResolved$: Observable<boolean>;

  isAdmin(): Observable<boolean>
  buildItemsService(): Observable<ItemsService>;
  update(config: ShopConfigV1): void;
}
