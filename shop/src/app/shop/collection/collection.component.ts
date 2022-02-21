import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BigNumber } from 'ethers';
import { combineLatest, Observable } from 'rxjs';
import { map, mergeMap, take } from 'rxjs/operators';
import { CartService } from 'src/app/core';
import { CollectionV1, IdentifiedCollection, IdentifiedItem, ItemV1, ShopError } from 'src/app/shared';
import { CollectionsService } from '../collections.service';
import { Price, sumPrices } from '../price/price';

interface ItemView {
  id: number;
  collectionId: number;
  price: Price;
  mime: string;
  name: string;
  description: string;
}

interface CollectionView {
  id: number;
  name: string;
  images: { url: string; description: string }[];
  totalPrice: Price;
  description: string;
  items: ItemView[]
}

@Component({
  selector: 'app-collection',
  templateUrl: './collection.component.html',
  styleUrls: ['./collection.component.scss']
})
export class CollectionComponent {

  private readonly identifiedCollection$: Observable<IdentifiedCollection>;
  private readonly identifiedItems$: Observable<IdentifiedItem[]>;

  readonly collection$: Observable<CollectionView>;
  readonly collectionItems$: Observable<ItemView[]>;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly collectionService: CollectionsService,
    private readonly cartService: CartService
  ) {
    const cId = this.route.paramMap.pipe(
      map(x => x.get('id') ?? '0'),
      map(x => parseInt(x))
    );

    this.identifiedCollection$ = cId.pipe(
      mergeMap(x => this.collectionService.getCollection(x)),
      map(x => {
        if (x == null) {
          // Redirect to not found
          this.router.navigate(['..', 'not-found'], { relativeTo: route });
          throw new ShopError('Collection not found');
        }

        return x;
      }),
    );

    this.identifiedItems$ = cId.pipe(
      mergeMap(id => this.collectionService.getCollectionItemsV1(id)),
    );

    this.collection$ = combineLatest(
      [this.identifiedCollection$, this.identifiedItems$]
    ).pipe(
      map(([idCollection, idItems]) => {
        if (idCollection.collection.version !== '1') {
          throw new ShopError(`Unknown collection version: ${idCollection.collection.version}`);
        }

        const c1 = idCollection.collection as CollectionV1;
        const itemsV1 = idItems.map(i => this.toItemView(i));
        const totalPrice = sumPrices(itemsV1.map(i => i.price));

        return {
          id: idCollection.id,
          name: c1.name,
          images: c1.images,
          totalPrice: totalPrice,
          description: c1.description,
          items: itemsV1
        }
      }),
      take(1)
    );

    this.collectionItems$ = this.collection$.pipe(
      map(c => c.items)
    )
  }

  private toItemView(idItem: IdentifiedItem): ItemView {
    const itemV1 = idItem.item as ItemV1;
    return {
      id: idItem.id,
      collectionId: idItem.collectionId,
      price: {
        currency: itemV1.currency,
        price: BigNumber.from(itemV1.price)
      },
      mime: itemV1.mime,
      name: itemV1.name,
      description: itemV1.description
    }
  }

  addCollectionToCart(quantityInput: HTMLInputElement) {
    const quantity = parseInt(quantityInput.value);
    quantityInput.value = '1';

    this.identifiedItems$.subscribe(items => {
      items.forEach(item => {
        console.log(item);
        this.cartService.addItemQuantity(item, quantity);
      })
    });
  }

  addCollectionItemToCart(quantityInput: HTMLInputElement, itemId: number) {
    const quantity = parseInt(quantityInput.value);
    quantityInput.value = '1';

    this.identifiedItems$.subscribe(items => {
      const itemToAdd = items.find(x => x.id == itemId);
      if (!itemToAdd) {
        throw new ShopError('Can not find item id: ' + itemId);
      }
      this.cartService.addItemQuantity(itemToAdd, quantity);
    });
  }
}
