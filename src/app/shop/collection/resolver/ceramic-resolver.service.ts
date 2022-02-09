import { Injectable } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import { Collection, ShopError } from 'src/app/shared';
import { CollectionResolver } from './collection-resolver';

@Injectable({
  providedIn: 'root'
})
export class CeramicResolverService implements CollectionResolver {

  constructor() { }

  load(uris: string[]): Observable<Collection[]> {
    if (uris.length == 0) {
      return EMPTY;
    }

    const invalidUris = uris.filter(x => !x.startsWith('ceramic://'));
    if (invalidUris.length > 0) {
      throw new ShopError(`Can not resolve invalid URIs ${JSON.stringify(invalidUris)} with HttpResolverService`);
    }

    throw new Error('Method not implemented.');
  }
}
