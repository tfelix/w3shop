import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { environment } from "src/environments/environment";

export interface ShopInfo {
  shopName: string;
  description: string;
  isAdmin: boolean;
  shopIdentifier: string;
}

/**
 * Displays shop information for the header or the footer. This is done to decouple
 * it from shop resolving services and if there is an error during shop resolution.
 */
@Injectable({
  providedIn: 'root'
})
export class ShopInfoService {

  private readonly shopInfo = new BehaviorSubject<ShopInfo>(this.getDefaultShopInfo());
  public readonly shopInfo$: Observable<ShopInfo> = this.shopInfo.asObservable();

  private readonly isShopResolved = new BehaviorSubject<boolean>(false);
  public readonly isShopResolved$ = this.isShopResolved.asObservable();

  constructor() {
  }

  private getDefaultShopInfo(): ShopInfo {
    return {
      shopName: environment.defaultShopName,
      description: '',
      isAdmin: false,
      shopIdentifier: '',
    };
  }

  public resolveShop(shopInfo: ShopInfo) {
    this.isShopResolved.next(true);
    this.isShopResolved.complete();
    this.shopInfo.next(shopInfo);
    this.shopInfo.complete();
  }
}