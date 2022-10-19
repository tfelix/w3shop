import { Injectable } from '@angular/core';
import { concat, merge, NEVER, Observable, of } from 'rxjs';
import { map, mergeMap, shareReplay, take, tap } from 'rxjs/operators';
import { NetworkService, ProviderService, ShopServiceFactory } from 'src/app/core';
import { filterNotNull } from 'src/app/shared';

export enum ShopStatus {
  NONE,
  LOADING,
  NO_WALLET,
  WRONG_NETWORK,
  NO_ITEMS
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
      tap(x => console.log('shop')),
      mergeMap(shop => shop.getItemService().getItems()),
      tap(x => console.log(x)),
      map(items => (items.length === 0) ? ShopStatus.NO_ITEMS : ShopStatus.NONE)
    );
  }
}
