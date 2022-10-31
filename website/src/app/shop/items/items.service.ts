import { BigNumber } from 'ethers';
import { from, Observable, of } from 'rxjs';
import { map, mergeMap, tap, shareReplay, toArray } from 'rxjs/operators';
import { ShopError, ShopItem, UriResolverService } from 'src/app/core';
import { FileClientFactory } from 'src/app/core/file-client/file-client-factory';

import { Item, URL, ItemV1, ShopItemList } from 'src/app/shared';

/**
 * FIXME The item service must not be regenerated all the time because otherwise
 * items are re-queried all the time. Please hold it in memory once created and
 * as long as the shop service does not change.
 * Maybe change ShopFactory to ShopManager with better state management.
 */
export class ItemsService {
  private items$: Observable<ShopItem[]>;
  private resolvedItems: Map<string, ShopItem>;

  constructor(
    private readonly currency: string,
    private readonly itemUris: ShopItemList,
    private readonly uriResolver: UriResolverService,
    private readonly fileClientFactory: FileClientFactory,
  ) {
  }

  getItems(): Observable<ShopItem[]> {
    if (this.items$) {
      return this.items$;
    } else {
      console.debug('Fetching items from URIs: ', this.itemUris);

      const itemById: { id: string, uri: string }[] = [];
      let k: keyof typeof this.itemUris;
      for (k in this.itemUris) {
        const v = this.itemUris[k];
        itemById.push({ id: k, uri: v });
      }

      this.items$ = from(itemById).pipe(
        mergeMap(x => {
          const fileClient = this.fileClientFactory.getResolver(x.uri);
          return fileClient.get<Item>(x.uri).pipe(
            map(item => this.toShopItem(x.id, item))
          );
        }),
        toArray(),
        shareReplay(1),
      );

      return this.items$;
    }
  }

  getItem(itemId: string): Observable<ShopItem | undefined> {

    if (this.resolvedItems) {
      return of(this.resolvedItems.get(itemId));
    }

    // Resolve all items first.
    return this.getItems().pipe(
      tap(items => {
        this.resolvedItems = new Map<string, ShopItem>();
        items.forEach(i => {
          this.resolvedItems.set(i.id, i);
        });
      }),
      map(_ => this.resolvedItems.get(itemId)),
      shareReplay(1)
    );
  }

  nextItemId(): Observable<BigNumber> {
    return this.items$.pipe(map(is => BigNumber.from(is.length)));
  }

  private toShopItem(
    id: string,
    item: Item
  ): ShopItem {
    if (item.version === '1') {
      const itemV1 = item as ItemV1;
      const thumbnails: URL[] = itemV1.thumbnails.map(uri => this.uriResolver.toURL(uri));

      let primaryThumbnail: URL;
      if (thumbnails.length == 0) {
        // TODO Use a proper placeholder thumbnail
        primaryThumbnail = '';
      } else {
        primaryThumbnail = thumbnails[0];
      }

      return {
        id,
        isSold: itemV1.isSold,
        name: itemV1.name,
        description: itemV1.description,
        mime: itemV1.mime,
        thumbnails,
        primaryThumbnail,
        price: {
          currency: this.currency,
          amount: BigNumber.from(itemV1.price)
        },
      }
    } else {
      throw new ShopError('Unknown Item version: ' + item.version);
    }
  }
}
