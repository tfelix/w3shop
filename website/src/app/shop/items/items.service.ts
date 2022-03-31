import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ShopService } from 'src/app/core';

import { IdentifiedData, Item } from 'src/app/shared';

import { ItemResolverService } from '../resolver/item-resolver.service';
import { UriId } from '../resolver/resolver';

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

@Injectable({
  providedIn: 'root'
})
export class ItemsService {
  public readonly items$: Observable<IdentifiedData<Item>[]>;

  constructor(
    @Inject('Shop') shopService: ShopService,
    private readonly collectionResolverService: ItemResolverService
  ) {
    // FIXME
    /*
    this.items$ = shopService.configV1$.pipe(
      mergeMap(config => {
        const uriIds = convertToUriIds(config.itemUris);

        return this.collectionResolverService.load(uriIds);
      }),
    );*/
  }
}
