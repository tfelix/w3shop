import { Injectable } from "@angular/core";
import { concat, Observable, of } from "rxjs";
import { map, shareReplay } from "rxjs/operators";
import { environment } from "src/environments/environment";
import { ShopServiceFactory } from "./shop-service-factory.service";

export interface ShopInfo {
  shopName: string;
  description: string;
  shortDescription: string;
  smartContractAddress: string;
  isAdmin: boolean;
  shopIdentifier: string;
  /**
   * Is true if the shop info was retrived from the blockchain. If it
   * was filled e.g. with default values this is false.
   */
  isResolved: boolean;
}

/**
 * This bundles all the sources for a shop information and combines them into a ShopInfo document.
 * It then pushes this information the the relevant services that control the information of those
 * components e.g. like the navbar service or the footer service.
 */
@Injectable({
  providedIn: 'root'
})
export class ShopInfoService {

  private readonly shopInfo$: Observable<ShopInfo>;

  constructor(
    private readonly shopFactory: ShopServiceFactory
  ) {
    const defaultShopInfo$ = of(this.getDefaultShopInfo());
    const resolvedShopInfo$ = this.getResolvedShopInfo();

    // Place into shop service.
    console.log('###### ShopInfo Service');

    this.shopInfo$ = concat(
      defaultShopInfo$,
      resolvedShopInfo$
    ).pipe(shareReplay(1));

    this.shopInfo$.subscribe(si => {
      console.log(si);
    })
  }

  private getDefaultShopInfo(): ShopInfo {
    return {
      shopName: environment.defaultShopName,
      description: '',
      shortDescription: '',
      isAdmin: false,
      shopIdentifier: '',
      smartContractAddress: '',
      isResolved: false
    };
  }

  private getResolvedShopInfo(): Observable<ShopInfo> {
    return this.shopFactory.getShopService().pipe(
      map(s => {
        return {
          shopName: s.shopName,
          description: s.description,
          shopIdentifier: s.identifier,
          shortDescription: s.shortDescription,
          smartContractAddress: s.smartContractAddress,
          isAdmin: s.isAdmin,
          isResolved: true
        }
      }),
    );
  }
}