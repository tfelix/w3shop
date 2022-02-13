import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EMPTY, forkJoin, from, Observable, of, zip } from 'rxjs';
import { map, mergeMap, toArray } from 'rxjs/operators';

import { Collection, IdentifiedCollection, ShopError } from 'src/app/shared';

import { CollectionResolver, UriId } from './collection-resolver';

@Injectable({
  providedIn: 'root'
})
export class HttpResolverService implements CollectionResolver {

  constructor(
    private readonly http: HttpClient,
  ) { }

  load(uriIds: UriId[]): Observable<IdentifiedCollection[]> {
    if (uriIds.length == 0) {
      return EMPTY;
    }

    const invalidUris = uriIds.filter(x => !x.uri.startsWith('http://') && !x.uri.startsWith('https://'));
    if (invalidUris.length > 0) {
      throw new ShopError(`Can not resolve invalid URIs ${JSON.stringify(invalidUris)} with HttpResolverService`);
    }

    return from(uriIds).pipe(
      mergeMap(uri => forkJoin({
        id: of(uri.id),
        collection: this.http.get<Collection>(uri.uri)
      })),
      toArray()
    );
  }
}
