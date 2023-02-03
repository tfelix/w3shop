import { Component, OnInit } from '@angular/core';
import { faCartShopping } from '@fortawesome/free-solid-svg-icons';
import { Observable, of } from 'rxjs';
import { catchError, filter, map, mergeMap, shareReplay } from 'rxjs/operators';
import { ShopServiceFactory } from '../shop-service-factory.service';

import { ProviderService } from 'src/app/blockchain';
import { ShopItem } from '../shop-item';

@Component({
  selector: 'w3s-items',
  templateUrl: './items.component.html',
  styleUrls: ['./items.component.scss']
})
export class ItemsComponent implements OnInit {

  faCartShopping = faCartShopping;

  readonly items: ShopItem[] = [];
  isWalletConnected$: Observable<boolean> = this.providerService.isWalletConnected$;

  constructor(
    private readonly shopFacadeFactory: ShopServiceFactory,
    private readonly providerService: ProviderService,
  ) {
  }

  ngOnInit(): void {
    // This might be dangerous as we are doing a bit too much in the ctor which
    // can confuse Angular. But its just simpler to build it here. As long as the
    // shop was resolved that should be fine.
    this.shopFacadeFactory.getShopService().pipe(
      filter(x => !!x),
      map(shop => shop.getItemService()),
      mergeMap(itemsService => itemsService.getItems()),
      shareReplay(1),
      catchError(_ => of([]))
    ).subscribe(items => this.items.push(...items));
  }
}
