import { Injectable } from '@angular/core';
import { combineLatest, concat, from, Observable, of } from 'rxjs';
import { filter, map, mergeMap, scan, shareReplay, take, tap, toArray } from 'rxjs/operators';
import { FileClientFactory } from 'src/app/blockchain';
import { Erc1155Metadata, Progress } from 'src/app/shared';
import { ShopItem } from '../shop-item';
import { ShopServiceFactory } from '../shop-service-factory.service';

export interface OwnedItem {
  name: string;
  amount: number;
  tokenId: string;

  // Use this properties instead of depending on the Erc metadata
  file: {
    encryptedKey: string;
    filename: string;
    accessCondition: string;
    mime: string;
    uri: string;
  }
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
    private readonly fileClientFactory: FileClientFactory
  ) { }

  /**
   * This is a very dump implementation, we scan the owned item quantities by
   * asking the Webshop what is there and then querying the item contract if
   * we own any of these items.
   * It would make more sense to use this maybe as fallback but actually use
   * an indexer when querying those information.
   */
  scanOwnedItems(): Observable<Progress<OwnedItem[]>> {
    const shop$ = this.shopFactory.getShopService().pipe(
      take(1),
      shareReplay(1),
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
      mergeMap(item => this.checkItemQuantity(item)),
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
      };
    } else {
      return {
        progress: 100,
        text: OwnedItemsService.PROGRESS_TEXT,
        result: scannedItems || []
      };
    }
  }

  private checkItemQuantity(
    item: ShopItem
  ): Observable<OwnedItem> {
    return this.shopFactory.getShopService().pipe(
      mergeMap(shop => shop.getItemBalance(item.id)),
      mergeMap(balance => this.makeOwnedItem(balance, item)),
      take(1),
    );
  }

  private makeOwnedItem(amount: number, item: ShopItem): Observable<OwnedItem> {
    return this.loadErc1155Metadata(item.id).pipe(
      map(metadata => ({
        amount,
        tokenId: item.id,
        name: item.name,
        file: {
          encryptedKey: metadata.properties.encrypted_key,
          uri: metadata.properties.content_uri,
          encryptionKey: metadata.properties.encrypted_key,
          mime: item.mime,
          filename: item.filename,
          // it is base64 encoded
          accessCondition: metadata.properties.access_condition
        }
      }))
    );
  }

  private loadErc1155Metadata(tokenId: string): Observable<Erc1155Metadata> {
    return this.shopFactory.getShopService().pipe(
      mergeMap(shop => shop.getItemUri(tokenId)),
      mergeMap(uri => {
        const fileClient = this.fileClientFactory.getResolver(uri);
        return fileClient.get<Erc1155Metadata>(uri);
      })
    );
  }

  private static readonly PROGRESS_TEXT = 'Scanning item(s)...';
}
