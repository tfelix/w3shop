import { Injectable } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';

import { ShopError } from 'src/app/core';
import { IdentifiedCollection } from 'src/app/shared';
import { CollectionResolver, UriId } from './collection-resolver';

@Injectable({
  providedIn: 'root'
})
export class CeramicResolverService implements CollectionResolver {

  constructor() { }

  load(uris: UriId[]): Observable<IdentifiedCollection[]> {
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
