import { Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { BootstrapService, Collection, ShopConfigV1, ShopError } from 'src/app/shared';
import { CollectionResolverService } from '../collection/resolver/collection-resolver.service';

@Injectable({
  providedIn: 'root'
})
export class CollectionsService {

  private collections: ReplaySubject<Collection[]> = new ReplaySubject(1);

  public readonly collections$: Observable<Collection[]> = this.collections.asObservable();
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
          return this.collectionResolverService.load(configV1.collectionUris);
        } else {
          throw new ShopError('Unknown config version: ' + x.version);
        }
      }),
    ).subscribe(x => this.collections.next(x));
  }
}
