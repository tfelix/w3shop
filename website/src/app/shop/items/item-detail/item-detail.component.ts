import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, Observable } from 'rxjs';
import { map, mergeMap, pluck, take, tap } from 'rxjs/operators';
import { ShopItem, ShopServiceFactory } from 'src/app/core';
import { skipNull } from 'src/app/shared';

interface ItemDetailView {
  name: string;
  description: string;
}

@Component({
  selector: 'w3s-item-detail',
  templateUrl: './item-detail.component.html',
  styleUrls: ['./item-detail.component.scss']
})
export class ItemDetailComponent implements OnInit {

  shopItem$: Observable<ShopItem>;
  itemName$: Observable<string>;

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
      skipNull(),
      take(1),
      map(s => s.getItemService()),
    );

    this.shopItem$ = forkJoin([itemId$, itemService$]).pipe(
      mergeMap(([itemId, itemService]) => itemService.getItem(itemId))
    );

    this.itemName$ = this.shopItem$.pipe(
      map(x => !!x ? this.shopItemToView(x) : ItemDetailComponent.SHOP_ITEM_NOT_FOUND),
      pluck('name')
    );
  }

  private shopItemToView(shopItem: ShopItem): ItemDetailView {
    return {
      name: shopItem.name,
      description: shopItem.description
    };
  }

  private static SHOP_ITEM_NOT_FOUND: ItemDetailView = {
    name: 'Not Found',
    description: '',
  }
}
