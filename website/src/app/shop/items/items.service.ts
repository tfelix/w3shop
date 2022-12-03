import { BigNumber } from 'ethers';
import { from, Observable, of } from 'rxjs';
import { map, mergeMap, tap, shareReplay, toArray } from 'rxjs/operators';
import { FileClientFactory } from 'src/app/blockchain';
import { ShopError, UriResolverService } from 'src/app/core';

import { Item, URL, ItemV1, ShopItemList } from 'src/app/shared';

import { makeMerkleRoot } from '../proof/proof-generator';
import { ShopItem } from '../shop-item';

export class ItemsService {
  private items$: Observable<ShopItem[]>;
  private resolvedItems: Map<string, ShopItem>;

  constructor(
    private readonly currency: string,
    private readonly itemUris: ShopItemList,
    private readonly fileClientFactory: FileClientFactory,
    private readonly uriResolver: UriResolverService
  ) {
  }

  /**
   * Returns null if there are no items in the shop and thus a merkle root can
   * not be computed.
   */
  getMerkleRoot(): Observable<string | null> {
    return this.getItems().pipe(
      map(items => {
        if (items.length === 0) {
          return null;
        }

        const itemIds = items.map(i => BigNumber.from(i.id));
        const itemPrices = items.map(i => BigNumber.from(i.price.amount));

        console.log('Calculating merkle root for:', items);

        return makeMerkleRoot(itemIds, itemPrices);
      })
    );
  }

  getAllItems(): Observable<ShopItem[]> {
    if (!this.items$) {
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
    }

    return this.items$;
  }

  getItems(): Observable<ShopItem[]> {
    return this.getAllItems().pipe(
      map(items => items.filter(item => item.isSold)),
      shareReplay(1)
    );
  }

  // FIXME there is a bug in the checkout panel when reloading while having
  // items in the cart. They fail to load and thus display.
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

  addItem(itemId: string, itemUri: string) {
    // const shopItem = this.toShopItem(itemId, item);
    // This is quite an inefficent way of doing it as all items
    // are getting re-fetched. Think of a better way and only add
    // the new item.
    this.itemUris[itemId] = itemUri;
    this.items$ = null;
  }

  private toShopItem(
    itemId: string,
    item: Item
  ): ShopItem {
    if (item.version === '1') {
      const itemV1 = item as ItemV1;

      // This is not ideal, better would be to keep the URIs until the component
      // where its displayed and then decide there how to resolve the URI (e.g. if its
      // an ipfs:// one).
      const resolvedThumbnailUrls = itemV1.thumbnails.map(uri => this.uriResolver.toURL(uri));

      let primaryThumbnail: URL;
      if (resolvedThumbnailUrls.length == 0) {
        // TODO Use a proper placeholder thumbnail
        primaryThumbnail = '';
      } else {
        primaryThumbnail = resolvedThumbnailUrls[0];
      }

      return {
        id: itemId,
        isSold: itemV1.isSold,
        name: itemV1.name,
        description: itemV1.description,
        filename: itemV1.filename,
        mime: itemV1.mime,
        thumbnails: resolvedThumbnailUrls,
        primaryThumbnail,
        price: {
          currency: this.currency,
          amount: BigNumber.from(itemV1.price)
        },
      };
    } else {
      throw new ShopError('Unknown Item version: ' + item.version);
    }
  }
}
