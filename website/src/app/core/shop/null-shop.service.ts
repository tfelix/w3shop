import { Observable, of } from "rxjs";
import { ShopConfigV1 } from "src/app/shared";
import { environment } from "src/environments/environment";
import { ShopError } from "../shop-error";
import { ShopService } from "./shop.service";

/**
 * Placeholder when no shop was detected.
 */
 export class NullShopService implements ShopService {
  identifier$: Observable<string> = of('');
  smartContract$: Observable<string> = of('');
  shopName$: Observable<string> = of(environment.defaultShopName);
  shortDescription$: Observable<string> = of('');
  description$: Observable<string> = of('');
  keywords$: Observable<string[]> = of([]);
  isResolved$: Observable<boolean> = of(false);

  update(config: ShopConfigV1): void {
    throw new ShopError("Shop was not resolved and can not be updated");
  }
}