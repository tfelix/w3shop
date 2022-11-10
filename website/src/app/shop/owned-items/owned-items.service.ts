import { Injectable } from '@angular/core';
import { BigNumber } from 'ethers';
import { combineLatest, concat, forkJoin, from, merge, Observable, of, Subject } from 'rxjs';
import { defaultIfEmpty, filter, map, mergeMap, scan, share, shareReplay, take, tap, toArray } from 'rxjs/operators';
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

  constructor(
    private readonly shopFactory: ShopServiceFactory,
    private readonly shopItemsContract: ShopItemsContractService,
    private readonly providerService: ProviderService,
    private readonly nftResolverService: NftResolverService
  ) { }

  /**
   * This is a very dump implementation, we scan the owned item quantities by
   * asking the Webshop what is there and then querying the item contract if
   * we own any of these items.
   * It would make more sense to use this maybe as fallback but actually use
   * an indexer when querying those information.
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
      mergeMap(s => s.getItemService().getAllItems()),
    );

    const shopItemCount$ = shopItems$.pipe(
      map(items => items.length),
      shareReplay(1)
    );

    const shopItemsStream$ = shopItems$.pipe(
      mergeMap(from),
      mergeMap(item => this.checkItemQuantity(walletAddr$, item)),
      shareReplay(1)
    );

    const currentItemCount$ = shopItemsStream$.pipe(
      scan((acc, _) => acc + 1, 0),
    );

    const ownedItems$: Observable<OwnedItem[] | null> = shopItemsStream$.pipe(
      filter(x => x.amount > 0),
      toArray(),
      map(x => x.length === 0 ? null : x),
    );

    const progress$ = combineLatest([
      shopItemCount$,
      currentItemCount$,
      ownedItems$
    ]).pipe(
      map(x => this.processProgress(x)),
    );

    return concat(
      of({ progress: 0, text: OwnedItemsService.PROGRESS_TEXT, result: null }),
      progress$
    ).pipe(
      tap(x => console.log('out: ', x)),
      shareReplay(1)
    );
  }

  private processProgress(data: [number, number, OwnedItem[] | null]): Progress<OwnedItem[]> {
    const [totalItemCount, scannedItemCount, scannedItems] = data;

    if (scannedItemCount < totalItemCount) {
      return {
        progress: Math.round((100 * scannedItemCount) / totalItemCount),
        text: OwnedItemsService.PROGRESS_TEXT,
        result: null
      }
    } else {
      return {
        progress: 100,
        text: OwnedItemsService.PROGRESS_TEXT,
        result: scannedItems || []
      }
    }
  }

  private checkItemQuantity(
    walletAddr$: Observable<string>,
    item: ShopItem
  ): Observable<OwnedItem> {
    return walletAddr$.pipe(
      mergeMap(walletAddr => this.shopItemsContract.balanceOf(walletAddr, BigNumber.from(item.id))),
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
