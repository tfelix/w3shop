import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IdentifiedData, Item } from 'src/app/shared';
import { HttpItemResolverService } from './http-item-resolver.service';
import { Resolver, UriId } from './resolver';

@Injectable({
  providedIn: 'root'
})
export class ItemResolverService implements Resolver<IdentifiedData<Item>> {

  constructor(
    private readonly httpCollectionResolver: HttpItemResolverService,
  ) { }

  load(uris: UriId[]): Observable<IdentifiedData<Item>[]> {
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
