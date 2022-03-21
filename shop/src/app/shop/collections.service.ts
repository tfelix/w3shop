import { Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { filter, map, mergeMap, take } from 'rxjs/operators';

import { ConfigResolverService, ShopError } from 'src/app/core';
import { IdentifiedCollection, CollectionV1, IdentifiedItem, ShopConfigV1 } from 'src/app/shared';

import { UriId } from './collection/resolver/collection-resolver';
import { CollectionResolverService } from './collection/resolver/collection-resolver.service';

@Injectable({
  providedIn: 'root'
})
export class CollectionsService {

  private collections: ReplaySubject<IdentifiedCollection[]> = new ReplaySubject(1);

  public readonly collections$: Observable<IdentifiedCollection[]> = this.collections.asObservable();
  public readonly activeFilterTags: string[] = [];

  constructor(
    configResolverService: ConfigResolverService,
    private readonly collectionResolverService: CollectionResolverService

  ) {
    // Put this into a service to enable filtering etc.
    configResolverService.configV1$.pipe(
      mergeMap(x => {
        const configV1 = x as ShopConfigV1;
        const uriIds = []; // this.convertToUriIds(configV1.collectionUris);

        return this.collectionResolverService.load(uriIds);
      }),
    ).subscribe(x => this.collections.next(x));
  }

  getCollection(id: number): Observable<IdentifiedCollection | null> {
    return this.collections$.pipe(
      map(x => x.find(x => x.id === id) ?? null),
      take(1)
    );
  }

  // TODO Consolidate this logic maybe in a own service that only does the
  //    transformation into some kind of view model.
  getCollectionItems(id: number): Observable<IdentifiedItem[]> {
    return this.getCollection(id).pipe(
      map(x => {
        if (x === null) {
          return [];
        } else {
          if (x.collection.version == '1') {
            const c1 = x.collection as CollectionV1;

            return c1.items.map((item, i) => {
              if (item === null) {
                return null;
              } else {
                const identifiedItem: IdentifiedItem = {
                  id: i + 1,
                  item: item,
                  collectionId: id
                };

                return identifiedItem;
              }
            });
          } else {
            throw new ShopError('Unknown collection version: ' + x.collection.version);
          }
        }
      }),
      take(1),
      filter(x => x !== null)
    ) as Observable<IdentifiedItem[]>;
  }

  getCollectionItemsV1(id: number): Observable<IdentifiedItem[]> {
    return this.getCollectionItems(id).pipe(
      map(x => x.filter(a => a.item.version == '1'))
    ) as Observable<IdentifiedItem[]>
  }

  private convertToUriIds(uris: (string | null)[]): UriId[] {
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
}
