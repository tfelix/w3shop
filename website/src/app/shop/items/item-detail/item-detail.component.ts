import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, Observable } from 'rxjs';
import { map, mergeMap, pluck, take } from 'rxjs/operators';
import { ShopItem, ShopServiceFactory } from 'src/app/core';
import { filterNotNull, URL } from 'src/app/shared';
import { Price, toPrice } from '../../price/price';

interface ItemDetailView {
  name: string;
  description: string;
  thumbnails: URL[];
}

@Component({
  selector: 'w3s-item-detail',
  templateUrl: './item-detail.component.html',
  styleUrls: ['./item-detail.component.scss']
})
export class ItemDetailComponent implements OnInit {

  shopItem$: Observable<ShopItem>;
  item$: Observable<ItemDetailView>;

  itemName$: Observable<string>;
  description$: Observable<string>;
  thumbnails$: Observable<string[]>;
  price$: Observable<Price>;

  mainImageUrl: string;

  constructor(
    private route: ActivatedRoute,
    private shopFactory: ShopServiceFactory
  ) { }

  ngOnInit(): void {
    const itemId$ = this.route.params.pipe(
      pluck('id'),
      take(1)
    );

    const itemService$ = this.shopFactory.shopService$.pipe(
      filterNotNull(),
      take(1),
      map(s => s.getItemService()),
    );

    this.shopItem$ = forkJoin([itemId$, itemService$]).pipe(
      mergeMap(([itemId, itemService]) => itemService.getItem(itemId)),
      // If item is not found, do something here. catchError(x => {})
    );

    this.item$ = this.shopItem$.pipe(
      map(x => this.shopItemToView(x)),
      // If item is not found, do something here. catchError(x => {})
    );

    this.price$ = this.shopItem$.pipe(map(x => toPrice(x)));
    this.itemName$ = this.item$.pipe(pluck('name'));
    this.description$ = this.item$.pipe(pluck('description'));
    this.thumbnails$ = this.item$.pipe(pluck('thumbnails'));
  }

  changeImage(url: string) {
    this.mainImageUrl = url;
  }

  private shopItemToView(shopItem: ShopItem): ItemDetailView {
    return {
      name: shopItem.name,
      description: shopItem.description,
      thumbnails: shopItem.thumbnails
    };
  }
}
