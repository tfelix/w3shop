import { Injectable } from '@angular/core';
import { BigNumber } from 'ethers';
import { combineLatest, forkJoin, from, Observable } from 'rxjs';
import { defaultIfEmpty, filter, map, mergeMap, scan, share, shareReplay, take, toArray } from 'rxjs/operators';
import { ProviderService, ShopContractService, ShopItem, ShopService, ShopServiceFactory } from 'src/app/core';
import { Progress } from 'src/app/shared';
import { NftResolverService, NftToken } from '../nft-resolver.service';

export interface OwnedItem {
  amount: number;
  tokenId: string;
  nft: NftToken;
}

@Injectable({
  providedIn: 'root'
})
export class OwnedItemsService {

  constructor(
    private readonly shopFactory: ShopServiceFactory,
    private readonly shopContract: ShopContractService,
    private readonly providerService: ProviderService,
    private readonly nftResolverService: NftResolverService
  ) { }

  /**
   * This is a very dump implementation, we scan the owned item quantities by
   * asking the
   */
  scanOwnedItems(): Observable<Progress<OwnedItem[]>> {
    const shop$ = this.shopFactory.shopService$.pipe(
      filter(s => !!s),
      take(1),
      shareReplay(1),
    );

    const walletAddr$ = this.providerService.address$.pipe(
      take(1),
      shareReplay(1)
    );

    const shopItems$ = shop$.pipe(
      mergeMap(s => s.getItemService().getItems()),
    );

    const shopItemCount$ = shopItems$.pipe(
      map(items => items.length),
      shareReplay(1)
    );

    const shopItemsStream$ = shopItems$.pipe(
      mergeMap(items => from(items)),
      mergeMap(item => this.checkItemQuantity(shop$, walletAddr$, item)),
      share()
    );

    const currentItemCount$ = shopItemsStream$.pipe(
      scan((acc, _) => acc + 1, 0)
    );

    const allItems$: Observable<OwnedItem[] | null> = shopItemsStream$.pipe(
      filter(x => x.amount > 0),
      toArray(),
      defaultIfEmpty(null)
    );

    return combineLatest([
      shopItemCount$,
      currentItemCount$,
      allItems$
    ]).pipe(
      scan((
        previous: Progress<OwnedItem[]>,
        next: [number, number, OwnedItem[] | null]
      ): Progress<OwnedItem[]> => {
        const [totalItemCount, scannedItemCount, result] = next;
        if (result) {
          return {
            progress: 100,
            text: OwnedItemsService.PROGRESS_TEXT,
            result: result,
          }
        } else {
          return {
            progress: Math.round((100 * scannedItemCount) / totalItemCount),
            text: OwnedItemsService.PROGRESS_TEXT,
            result: null
          }
        }
      },
        { progress: 0, text: OwnedItemsService.PROGRESS_TEXT, result: null }
      )
    )
  }

  private checkItemQuantity(
    shop$: Observable<ShopService>,
    walletAddr$: Observable<string>,
    item: ShopItem
  ): Observable<OwnedItem> {
    return forkJoin([
      shop$,
      walletAddr$
    ]).pipe(
      mergeMap(([shop, walletAddr]) => this.shopContract.getBalanceOf(shop.smartContractAddress, walletAddr, BigNumber.from(item.id))),
      mergeMap(balance => this.makeOwnedItem(balance, item)),
      take(1),
    )
  }

  private makeOwnedItem(amount: number, item: ShopItem): Observable<OwnedItem> {
    return this.nftResolverService.resolve(item.id.toString()).pipe(
      map(nft => ({ amount, nft, tokenId: item.id.toString() }))
    );
  }

  private static readonly PROGRESS_TEXT = 'Scanning item(s)...';
}
