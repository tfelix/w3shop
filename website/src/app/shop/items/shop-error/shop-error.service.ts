import { Injectable } from '@angular/core';
import { concat, EMPTY, iif, merge, NEVER, Observable, of, throwError } from 'rxjs';
import { catchError, map, mergeMap, shareReplay, take, tap } from 'rxjs/operators';
import { NetworkService, ProviderService, ShopIdentifierError, ShopServiceFactory } from 'src/app/core';
import { filterNotNull } from 'src/app/shared';

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
    );
  }

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
      })
    );
  }

  private checkItems(): Observable<ShopStatus> {
    return this.shopFacadeFactory.shopService$.pipe(
      filterNotNull(),
      mergeMap(shop => shop.getItemService().getItems()),
      map(items => (items.length === 0) ? ShopStatus.NO_ITEMS : ShopStatus.NONE)
    );
  }
}
