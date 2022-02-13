import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BigNumber } from 'ethers';
import { Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { CollectionId, CollectionV1, ShopError } from 'src/app/shared';
import { CollectionsService } from '../collections.service';
import { PriceView } from '../price/price.component';

@Component({
  selector: 'app-collection',
  templateUrl: './collection.component.html',
  styleUrls: ['./collection.component.scss']
})
export class CollectionComponent {

  collectionId$: Observable<CollectionId>

  collection$: Observable<CollectionV1>
  price$: Observable<PriceView>

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private collectionService: CollectionsService,
  ) {
    this.collectionId$ = this.route.paramMap.pipe(
      map(x => x.get('id') ?? '0'),
      mergeMap(x => this.collectionService.getCollection(parseInt(x))),
      map(x => {
        if (x == null) {
          // Redirect to not found
          this.router.navigate(['..', 'not-found'], { relativeTo: route });
          throw new ShopError('Collection not found');
        }

        return x;
      })
    );

    this.collection$ = this.collectionId$.pipe(
      map(x => {
        if (x.collection.version == '1') {
          return x.collection as CollectionV1;
        } else {
          throw new ShopError(`Unknown collection version: ${x.collection.version}`);
        }
      })
    );

    this.price$ = this.collection$.pipe(
      map(c => {
        return { currency: c.currency, price: BigNumber.from(c.totalPrice) }
      })
    );
  }

  addCollectionToCart(quantityInput: HTMLInputElement) {
    const quantity = parseInt(quantityInput.value);
    quantityInput.value = '1';
  }
}
