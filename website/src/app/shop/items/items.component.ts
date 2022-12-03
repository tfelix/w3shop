import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { faCartShopping } from '@fortawesome/free-solid-svg-icons';
import { Observable } from 'rxjs';
import { filter, map, mergeMap, shareReplay } from 'rxjs/operators';
import { ShopServiceFactory } from '../shop-service-factory.service';

import { ProviderService } from 'src/app/blockchain';
import { CartService } from '../cart.service';
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
    private readonly cartService: CartService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
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
      shareReplay(1)
    ).subscribe(items => this.items.push(...items));
  }

  addItemToCart(item: ShopItem, quantityInput: HTMLInputElement) {
    const quantity = parseInt(quantityInput.value);
    quantityInput.value = '1';

    this.cartService.addItemQuantity(item, quantity);
  }

  showItem(item: ShopItem) {
    this.router.navigate(['item', item.id], { relativeTo: this.route });
  }
}
