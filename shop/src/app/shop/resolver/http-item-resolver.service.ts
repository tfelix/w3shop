import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EMPTY, forkJoin, from, Observable, of } from 'rxjs';
import { mergeMap, toArray } from 'rxjs/operators';
import { ShopError } from 'src/app/core';
import { IdentifiedData, Item } from 'src/app/shared';

import { Resolver, UriId } from './resolver';

@Injectable({
  providedIn: 'root'
})
export class HttpItemResolverService implements Resolver<IdentifiedData<Item>> {

  constructor(
    private readonly http: HttpClient,
  ) { }

  load(uriIds: UriId[]): Observable<IdentifiedData<Item>[]> {
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
        data: this.http.get<Item>(uri.uri)
      })),
      toArray()
    );
  }
}
