import { Injectable } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';

import { ShopError } from 'src/app/core';
import { IdentifiedData, Item } from 'src/app/shared';
import { Resolver, UriId } from './resolver';

@Injectable({
  providedIn: 'root'
})
export class CeramicResolverService implements Resolver<IdentifiedData<Item>> {

  constructor() { }

  load(uris: UriId[]): Observable<IdentifiedData<Item>[]> {
    if (uris.length == 0) {
      return EMPTY;
    }

    const invalidUris = uris.filter(x => !x.uri.startsWith('ceramic://'));
    if (invalidUris.length > 0) {
      throw new ShopError(`Can not resolve invalid URIs ${JSON.stringify(invalidUris)} with HttpResolverService`);
    }

    throw new Error('Method not implemented.');
  }
}
