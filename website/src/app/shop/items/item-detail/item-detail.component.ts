import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { marked } from 'marked';
import { forkJoin, Observable, of, Subscription } from 'rxjs';
import { map, mergeMap, pluck, take } from 'rxjs/operators';

import { Price } from '../../../blockchain/price/price';
import { ShopItem } from '../../shop-item';
import { ShopServiceFactory } from '../../shop-service-factory.service';
import { ShopError } from 'src/app/core';

interface ItemDetailView {
  itemId: string;
  itemName: string;
  mime: string;
  filename: string;
  description: string;
  detailedDescription: string;
  thumbnails: string[];
  price: Price;
  shopItem: ShopItem;
}

@Component({
  selector: 'w3s-item-detail',
  templateUrl: './item-detail.component.html',
  styleUrls: ['./item-detail.component.scss']
})
export class ItemDetailComponent implements OnInit, OnDestroy {

  amountRange = Array.from(Array(100).keys()).map(x => x + 1);

  itemDetails$!: Observable<ItemDetailView>;

  mainImageUrl: string = '';

  private thumbnailSub!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private shopFactory: ShopServiceFactory,
  ) { }

  ngOnInit(): void {
    const itemId$ = this.route.params.pipe(
      map(x => x['id']),
      take(1)
    );

    const itemService$ = this.shopFactory.getShopService().pipe(
      take(1),
      map(s => s.getItemService()),
    );


    this.itemDetails$ = forkJoin([itemId$, itemService$]).pipe(
      mergeMap(([itemId, itemService]) => itemService.getItem(itemId) || null),
      map(item => {
        if (!item) {
          throw new ShopError(`Item could not be found`);
        }

        return {
          itemId: item.id,
          itemName: item.name,
          mime: item.mime,
          filename: item.filename,
          description: item.description,
          detailedDescription: marked.parse(item.detailedDescription),
          thumbnails: item.thumbnails,
          price: item.price,
          shopItem: item
        }
      })
      // If item is not found, do something here. catchError(x => {})
    );

    this.thumbnailSub = this.itemDetails$.subscribe(x => {
      if (x.thumbnails.length > 0) {
        this.changeImage(x.thumbnails[0]);
      }
    });
  }

  ngOnDestroy(): void {
    this.thumbnailSub.unsubscribe();
  }

  changeImage(url: string) {
    this.mainImageUrl = url;
  }
}
