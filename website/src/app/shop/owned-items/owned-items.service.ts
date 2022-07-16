import { Injectable } from '@angular/core';
import { BigNumber } from 'ethers';
import { BehaviorSubject, forkJoin, from, Observable } from 'rxjs';
import { endWith, filter, map, mergeMap, scan, share, shareReplay, startWith, switchMapTo, take, toArray, withLatestFrom } from 'rxjs/operators';
import { ProviderService, ShopContractService, ShopItem, ShopService, ShopServiceFactory } from 'src/app/core';
import { NftToken, Progress } from 'src/app/shared';
import { NftResolverService } from '../nft-resolver.service';

export interface OwnedItem {
  amount: number;
  tokenId: string;
  nft: NftToken;
}

@Injectable({
  providedIn: 'root'
})
export class OwnedItemsService {

  private ownedItems = new BehaviorSubject<OwnedItem[] | null>(null);
  public ownedItems$ = this.ownedItems.asObservable();

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
  scanOwnedItems(): Observable<Progress | null> {
    const shop$ = this.shopFactory.shopService$.pipe(
      filter(s => !!s),
      take(1),
      shareReplay(1),
    );

    const shopItems$ = shop$.pipe(
      mergeMap(s => s.getItemService().getItems()),
    );

    const count$ = shopItems$.pipe(
      map(items => items.length),
    );

    const shopItemsStream$ = shopItems$.pipe(
      mergeMap(items => from(items)),
      mergeMap(item => this.checkItemQuantity(shop$, item)),
      share()
    );

    const ratio$ = shopItemsStream$.pipe(
      scan(current => current + 1, 0),
      withLatestFrom(count$, (current, count) => Math.ceil(current / count * 100)),
    );

    shopItemsStream$.pipe(
      filter(x => x.amount > 0),
      toArray(),
    ).subscribe(ownedItems => {
      return this.ownedItems.next(ownedItems);
    });

    return shopItemsStream$.pipe(
      startWith({ progress: 0, text: OwnedItemsService.PROGRESS_TEXT }),
      switchMapTo(ratio$), map(r => this.toProgress(r)),
      endWith(null),

    )
  }

  private toProgress(ratio: number): Progress {
    return { progress: ratio, text: OwnedItemsService.PROGRESS_TEXT };
  }

  private checkItemQuantity(shop$: Observable<ShopService>, item: ShopItem): Observable<OwnedItem> {
    return forkJoin([
      shop$,
      this.providerService.address$.pipe(take(1))
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
