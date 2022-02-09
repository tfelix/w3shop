import { Injectable } from '@angular/core';
import { concat, Observable } from 'rxjs';
import { Collection } from 'src/app/shared';
import { CeramicResolverService } from './ceramic-resolver.service';
import { CollectionResolver } from './collection-resolver';
import { HttpResolverService } from './http-resolver.service';

@Injectable({
  providedIn: 'root'
})
export class CollectionResolverService implements CollectionResolver {

  constructor(
    private readonly httpCollectionResolver: HttpResolverService,
    private readonly ceramicCollectionResolver: CeramicResolverService
  ) { }

  load(uris: string[]): Observable<Collection[]> {
    const ceramicStreamIds = uris.filter(u => u.startsWith('ceramic://'));
    const httpUrls = uris.filter(u => u.startsWith('http://') || u.startsWith('https://'));

    /*
    return concat(
      this.httpCollectionResolver.load(httpUrls),
      this.ceramicCollectionResolver.load(ceramicStreamIds)
    )*/
    return this.httpCollectionResolver.load(httpUrls);
  }
}
