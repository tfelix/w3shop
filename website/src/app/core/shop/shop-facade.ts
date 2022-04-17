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
export interface ShopFacade {
  identifier$: Observable<string>;
  smartContractAddress$: Observable<string>;
  shopName$: Observable<string>;
  shortDescription$: Observable<string>;
  description$: Observable<string>;
  keywords$: Observable<string[]>;
  isResolved$: Observable<boolean>;
  isAdmin$: Observable<boolean>;

  buildItemsService(): Observable<ItemsService>;
  update(update: ShopConfigUpdate): Observable<Progress>
}