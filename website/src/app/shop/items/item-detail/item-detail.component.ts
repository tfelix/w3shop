import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, Observable, Subscription } from 'rxjs';
import { map, mergeMap, pluck, take } from 'rxjs/operators';

import { ShopItem } from 'src/app/core';

import { Price } from '../../price/price';
import { ShopServiceFactory } from '../../shop-service-factory.service';

@Component({
  selector: 'w3s-item-detail',
  templateUrl: './item-detail.component.html',
  styleUrls: ['./item-detail.component.scss']
})
export class ItemDetailComponent implements OnInit, OnDestroy {

  item$: Observable<ShopItem>;

  itemName$: Observable<string>;
  description$: Observable<string>;
  thumbnails$: Observable<string[]>;
  price$: Observable<Price>;

  mainImageUrl: string;

  private thumbnailSub: Subscription;

  constructor(
    private route: ActivatedRoute,
    private shopFactory: ShopServiceFactory,
  ) { }

  ngOnInit(): void {
    const itemId$ = this.route.params.pipe(
      pluck('id'),
      take(1)
    );

    const itemService$ = this.shopFactory.getShopService().pipe(
      take(1),
      map(s => s.getItemService()),
    );

    this.item$ = forkJoin([itemId$, itemService$]).pipe(
      mergeMap(([itemId, itemService]) => itemService.getItem(itemId)),
      // If item is not found, do something here. catchError(x => {})
    );

    this.price$ = this.item$.pipe(pluck('price'));
    this.itemName$ = this.item$.pipe(pluck('name'));
    this.description$ = this.item$.pipe(pluck('description'));
    this.thumbnails$ = this.item$.pipe(pluck('thumbnails'));

    this.thumbnailSub = this.thumbnails$.subscribe(x => {
      if (x.length > 0) {
        this.changeImage(x[0]);
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
