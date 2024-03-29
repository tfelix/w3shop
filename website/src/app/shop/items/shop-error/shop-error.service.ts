import { Injectable } from '@angular/core';
import { EMPTY, iif, merge, Observable, of } from 'rxjs';
import { catchError, map, mergeMap, shareReplay, tap } from 'rxjs/operators';
import { ProviderService } from 'src/app/blockchain';
import { NetworkService, ShopIdentifierError } from 'src/app/core';
import { filterNotNull } from 'src/app/shared';
import { ShopServiceFactory } from '../../shop-service-factory.service';

export enum ShopStatus {
  NONE,
  LOADING,
  NO_WALLET,
  WRONG_NETWORK,
  NO_ITEMS,
  INVALID_IDENTIFIER
}

@Injectable({
  providedIn: 'root'
})
export class ShopErrorService {

  shopStatus$: Observable<ShopStatus>;

  constructor(
    private readonly shopFacadeFactory: ShopServiceFactory,
    private readonly providerService: ProviderService,
    private readonly networkService: NetworkService,
  ) {
    this.shopStatus$ = merge(
      of(ShopStatus.LOADING),
      this.checkWalletConnected(),
      this.checkNetwork(),
      this.checkItems()
    ).pipe(
      catchError(e => iif(
        () => e instanceof ShopIdentifierError,
        of(ShopStatus.INVALID_IDENTIFIER),
        EMPTY
      )),
      shareReplay(1)
    );
  }

  private checkWalletConnected(): Observable<ShopStatus> {
    return this.providerService.isWalletConnected$.pipe(
      map(isConnected => (isConnected) ? ShopStatus.LOADING : ShopStatus.NO_WALLET),
      tap(x => console.log('checkWalletConnected(): ' + x))
    );
  }

  // FIXME this is actual wrong, important is what network the shop identifier tells you.
  private checkNetwork(): Observable<ShopStatus> {
    return this.providerService.chainId$.pipe(
      filterNotNull(),
      map(chainId => {
        const network = this.networkService.getExpectedNetwork();
        if (chainId === network.chainId) {
          return ShopStatus.LOADING;
        } else {
          return ShopStatus.WRONG_NETWORK;
        }
      }),
      tap(x => console.log('checkNetwork(): ' + x))
    );
  }

  private checkItems(): Observable<ShopStatus> {
    return this.shopFacadeFactory.getShopService().pipe(
      mergeMap(shop => shop.getItemService().getItems()),
      map(items => (items.length === 0) ? ShopStatus.NO_ITEMS : ShopStatus.NONE),
      // Most likely the shop can not be created because we are on a wrong chain.
      catchError(_ => EMPTY),
      tap(x => console.log('checkItems(): ' + x))
    );
  }
}
