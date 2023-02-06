import { Component, OnInit } from '@angular/core';
import { faCartShopping } from '@fortawesome/free-solid-svg-icons';
import { Observable, of } from 'rxjs';
import { catchError, filter, map, mergeMap, shareReplay } from 'rxjs/operators';
import { ShopServiceFactory } from '../shop-service-factory.service';

import { ShopItem } from '../shop-item';

@Component({
  selector: 'w3s-items',
  templateUrl: './items.component.html',
  styleUrls: ['./items.component.scss']
})
export class ItemsComponent implements OnInit {

  faCartShopping = faCartShopping;

  readonly items: ShopItem[] = [];
  showShopItems$: Observable<boolean>;

  constructor(
    private readonly shopFacadeFactory: ShopServiceFactory,
  ) {
  }

  ngOnInit(): void {
    this.showShopItems$ = this.shopFacadeFactory.isUserOnCorrectNetwork$;

    this.shopFacadeFactory.getShopService().pipe(
      filter(x => !!x),
      map(shop => shop.getItemService()),
      mergeMap(itemsService => itemsService.getItems()),
      shareReplay(1),
      catchError(_ => of([]))
    ).subscribe(items => this.items.push(...items));
  }
}
