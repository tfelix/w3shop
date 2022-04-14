import { from, Observable } from 'rxjs';
import { map, mergeMap, shareReplay, toArray } from 'rxjs/operators';
import { ShopError } from 'src/app/core';
import { FileClientFactory } from 'src/app/core/file-client/file-client-factory';

import { Item, ItemV1, ShopItem } from 'src/app/shared';

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

export class ItemsService {
  private items$: Observable<ShopItem[]>;

  constructor(
    private readonly itemUris: (string | null)[],
    private readonly fileClientFactory: FileClientFactory
  ) {
  }

  getItems(): Observable<ShopItem[]> {
    if (this.items$) {
      return this.items$;
    } else {
      console.debug('Fetching items from URIs');
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

  private toShopItem(id: number, item: Item): ShopItem {
    if (item.version === '1') {
      const itemV1 = item as ItemV1;

      return {
        id,
        ...itemV1
      }
    } else {
      throw new ShopError('Unknown Item version: ' + item.version);
    }
  }
}
