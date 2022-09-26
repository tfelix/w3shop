import { BigNumber } from 'ethers';
import { from, Observable, of, throwError } from 'rxjs';
import { map, mergeMap, tap, shareReplay, toArray } from 'rxjs/operators';
import { ShopError, ShopItem, UriResolverService } from 'src/app/core';
import { FileClientFactory } from 'src/app/core/file-client/file-client-factory';

import { Item, ItemV1 } from 'src/app/shared';

interface UriId {
  id: number;
  uri: string;
}

function convertToUriIds(uris: (string | null)[]): UriId[] {
  return uris.map((u, i) => {
    if (u === null) {
      return null;
    } else {
      return {
        id: i + 1,
        uri: u
      };
    }
  }).filter(x => x !== null) as UriId[];
}

/**
 * FIXME The item service must not be regenerated all the time because otherwise
 * items are re-queried all the time. Please hold it in memory once created and
 * as long as the shop service does not change.
 * Maybe change ShopFactory to ShopManager with better state management.
 */
export class ItemsService {
  private items$: Observable<ShopItem[]>;

  private resolvedItems = new Map<string, ShopItem>();

  constructor(
    private readonly itemUris: (string | null)[],
    private readonly uriResolver: UriResolverService,
    private readonly fileClientFactory: FileClientFactory
  ) {
  }

  getItems(): Observable<ShopItem[]> {
    if (this.items$) {
      return this.items$;
    } else {
      console.debug('Fetching items from URIs: ', this.itemUris);
      const uriIdsObs = from(convertToUriIds(this.itemUris));

      this.items$ = uriIdsObs.pipe(
        mergeMap(uid => {
          const fileClient = this.fileClientFactory.getResolver(uid.uri);

          return fileClient.get<Item>(uid.uri).pipe(
            map(item => this.toShopItem(uid.id, item))
          );
        }),
        toArray(),
        shareReplay(1),
      );

      return this.items$;
    }
  }

  getItem(itemId: string): Observable<ShopItem> {
    if (this.resolvedItems.has(itemId)) {
      return of(this.resolvedItems.get(itemId));
    }

    // TODO this is dangerous and probably will fail, shop items should not be adressed via an index.
    // TODO this is a hack as we probably need to save items with their string id and not only assume
    // an increasing number
    const itemIdNum = parseInt(itemId) - 1;
    const itemUri = this.itemUris[itemIdNum];

    if (!itemUri) {
      return throwError(new ShopError(`Uknown item with ID ${itemId}`));
    }

    const fileClient = this.fileClientFactory.getResolver(itemUri);

    return fileClient.get<Item>(itemUri).pipe(
      map(item => this.toShopItem(itemIdNum, item)),
      tap(shopItem => this.resolvedItems.set(itemId, shopItem)),
      shareReplay(1)
    );
  }

  nextItemId(): Observable<BigNumber> {
    return this.items$.pipe(map(is => BigNumber.from(is.length)));
  }

  private toShopItem(
    id: number,
    item: Item
  ): ShopItem {
    if (item.version === '1') {
      const itemV1 = item as ItemV1;
      const thumbnails = itemV1.thumbnails.map(thumbnailURI => {
        const thumbnailFileClient = this.fileClientFactory.getResolver(thumbnailURI);

        return this.uriResolver.toURL(thumbnailURI);
      });

      return {
        id,
        ...itemV1,
        thumbnails
      }
    } else {
      throw new ShopError('Unknown Item version: ' + item.version);
    }
  }
}
