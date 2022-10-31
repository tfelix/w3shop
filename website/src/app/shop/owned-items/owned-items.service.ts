import { Injectable } from '@angular/core';
import { BigNumber } from 'ethers';
import { combineLatest, forkJoin, from, Observable, Subject } from 'rxjs';
import { defaultIfEmpty, filter, map, mergeMap, scan, share, shareReplay, take, toArray } from 'rxjs/operators';
import { ProviderService } from 'src/app/blockchain';
import { ShopItemsContractService } from 'src/app/blockchain/shop-items-contract.service';
import { ShopItem } from 'src/app/core';
import { Progress } from 'src/app/shared';
import { NftResolverService, NftToken } from '../nft-resolver.service';
import { ShopServiceFactory } from '../shop-service-factory.service';
import { ShopService } from '../shop.service';

export interface OwnedItem {
  amount: number;
  tokenId: string;
  nft: NftToken;
}

/**
 * At best we could query all the items that the user owns. But this would require the usage of some
 * kind of indexer. For now we just iterate over all items that this shop has registered.
 */
@Injectable({
  providedIn: 'root'
})
export class OwnedItemsService {

  private progress = new Subject<Progress<OwnedItem[]>>();
  readonly progress$ = this.progress.asObservable();

  constructor(
    private readonly shopFactory: ShopServiceFactory,
    private readonly shopItemsContract: ShopItemsContractService,
    private readonly providerService: ProviderService,
    private readonly nftResolverService: NftResolverService
  ) { }

  /**
   * This is a very dump implementation, we scan the owned item quantities by
   * asking the
   */
  scanOwnedItems(): Observable<Progress<OwnedItem[]>> {
    const shop$ = this.shopFactory.shopService$.pipe(
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

  // TODO this can be improved if we only really load the items which balance > 0 right from the beginning.
  private checkItemQuantity(
    shop$: Observable<ShopService>,
    walletAddr$: Observable<string>,
    item: ShopItem
  ): Observable<OwnedItem> {
    return forkJoin([
      shop$,
      walletAddr$
    ]).pipe(
      mergeMap(([shop, walletAddr]) => this.shopItemsContract.balanceOf(shop.smartContractAddress, walletAddr, BigNumber.from(item.id))),
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
