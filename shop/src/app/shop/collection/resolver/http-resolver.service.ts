import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EMPTY, from, Observable } from 'rxjs';
import { mergeMap, toArray } from 'rxjs/operators';

import { Collection, ShopError } from 'src/app/shared';

import { CollectionResolver } from './collection-resolver';

@Injectable({
  providedIn: 'root'
})
export class HttpResolverService implements CollectionResolver {

  constructor(
    private readonly http: HttpClient,
  ) { }

  load(uris: string[]): Observable<Collection[]> {
    if (uris.length == 0) {
      return EMPTY;
    }

    const invalidUris = uris.filter(x => !x.startsWith('http://') && !x.startsWith('https://'));
    if (invalidUris.length > 0) {
      throw new ShopError(`Can not resolve invalid URIs ${JSON.stringify(invalidUris)} with HttpResolverService`);
    }

    return from(uris).pipe(
      mergeMap(uri => this.http.get<Collection>(uri)),
      toArray()
    );
  }
}
