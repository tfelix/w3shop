import { Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { BootstrapService, Collection, CollectionId, ShopConfigV1, ShopError } from 'src/app/shared';
import { UriId } from './collection/resolver/collection-resolver';
import { CollectionResolverService } from './collection/resolver/collection-resolver.service';

@Injectable({
  providedIn: 'root'
})
export class CollectionsService {

  private collections: ReplaySubject<CollectionId[]> = new ReplaySubject(1);

  public readonly collections$: Observable<CollectionId[]> = this.collections.asObservable();
  public readonly activeFilterTags: string[] = [];

  constructor(
    bootstrapService: BootstrapService,
    private readonly collectionResolverService: CollectionResolverService

  ) {
    // Put this into a service to enable filtering etc.
    bootstrapService.config$.pipe(
      mergeMap(x => {
        if (x.version == '1') {
          const configV1 = x as ShopConfigV1;
          const uriIds = this.convertToUriIds(configV1.collectionUris);
          return this.collectionResolverService.load(uriIds);
        } else {
          throw new ShopError('Unknown config version: ' + x.version);
        }
      }),
    ).subscribe(x => this.collections.next(x));
  }

  getCollection(id: number): Observable<CollectionId | null> {
    return this.collections$.pipe(
      map(x => x.find(x => x.id == id) ?? null)
    )
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
