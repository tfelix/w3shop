import { Injectable } from "@angular/core";
import { combineLatest, concat, forkJoin, Observable, of } from "rxjs";
import { filter, map, mergeMap, shareReplay, take, tap } from "rxjs/operators";
import { environment } from "src/environments/environment";
import { skipNull } from "../shared";
import { ShopIdentifierService } from "./shop/shop-identifier.service";
import { ShopServiceFactory } from "./shop/shop-service-factory.service";

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
 * Displays shop information for the header or the footer. This is done to decouple
 * it from shop resolving services and still display data, if there is an error during
 * shop resolution.
 */
@Injectable({
  providedIn: 'root'
})
export class ShopInfoService {

  public readonly shopInfo$: Observable<ShopInfo>;

  constructor(
    private readonly shopIdentifierService: ShopIdentifierService,
    private readonly shopFactory: ShopServiceFactory
  ) {
    const defaultShopInfo$ = of(this.getDefaultShopInfo());
    const identifierOnlyShopInfo$ = this.getIdentifierOnlyShopInfo();
    const resolvedShopInfo$ = this.getResolvedShopInfo();

    this.shopInfo$ = concat(
      defaultShopInfo$,
      identifierOnlyShopInfo$,
      resolvedShopInfo$
    ).pipe(shareReplay(1));
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

  private getIdentifierOnlyShopInfo(): Observable<ShopInfo> {
    return this.shopIdentifierService.identifier$.pipe(
      skipNull(),
      map(shopIdentifier => {
        return {
          shopName: environment.defaultShopName,
          description: '',
          shortDescription: '',
          isAdmin: false,
          isResolved: false,
          smartContractAddress: '',
          shopIdentifier
        };
      }),
      take(1)
    );
  }

  private getResolvedShopInfo(): Observable<ShopInfo> {
    const shopInfo$ = this.shopFactory.shopService$.pipe(
      skipNull(),
      map(s => {
        return {
          shopName: s.shopName,
          description: s.description,
          shopIdentifier: s.identifier,
          shortDescription: s.shortDescription,
          smartContractAddress: s.smartContractAddress
        }
      }),
    );

    const isAdmin$ = this.shopFactory.shopService$.pipe(
      skipNull(),
      mergeMap(s => s.isAdmin$),
    );

    return combineLatest([shopInfo$, isAdmin$]).pipe(
      map(([si, isAdmin]) => ({ ...si, isAdmin, isResolved: true })),
    );
  }
}