import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IdentifiedCollection } from 'src/app/shared';
import { CeramicResolverService } from './ceramic-resolver.service';
import { CollectionResolver, UriId } from './collection-resolver';
import { HttpResolverService } from './http-resolver.service';

@Injectable({
  providedIn: 'root'
})
export class CollectionResolverService implements CollectionResolver {

  constructor(
    private readonly httpCollectionResolver: HttpResolverService,
    private readonly ceramicCollectionResolver: CeramicResolverService
  ) { }

  load(uris: UriId[]): Observable<IdentifiedCollection[]> {
    const ceramicStreamIds = uris.filter(u => u.uri.startsWith('ceramics://'));
    const httpUrls = uris.filter(u => u.uri.startsWith('http://') || u.uri.startsWith('https://'));

    /*
    return concat(
      this.httpCollectionResolver.load(httpUrls),
      this.ceramicCollectionResolver.load(ceramicStreamIds)
    )*/
    return this.httpCollectionResolver.load(httpUrls);
  }
}
