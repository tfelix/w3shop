import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { faCartShopping } from '@fortawesome/free-solid-svg-icons';
import { Observable } from 'rxjs';
import { filter, map, mergeMap, shareReplay } from 'rxjs/operators';
import { CartService, ProviderService, ShopServiceFactory } from 'src/app/core';
import { ItemModel, ItemModelMapperService } from './item-model';

@Component({
  selector: 'app-collection',
  templateUrl: './items.component.html',
  styleUrls: ['./items.component.scss']
})
export class ItemsComponent {

  faCartShopping = faCartShopping;

  readonly items: ItemModel[] = [];
  isWalletConnected$: Observable<boolean> = this.providerService.isWalletConnected$;

  constructor(
    private readonly shopFacadeFactory: ShopServiceFactory,
    private readonly providerService: ProviderService,
    private readonly cartService: CartService,
    private readonly itemModelMapper: ItemModelMapperService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {
    // This might be dangerous as we are doing a bit too much in the ctor which
    // can confuse Angular. But its just simpler to build it here. As long as the
    // shop was resolved that should be fine.
    this.shopFacadeFactory.shopService$.pipe(
      filter(x => !!x),
      map(shop => shop.getItemService()),
      mergeMap(itemsService => itemsService.getItems()),
      map(items => items.map(i => this.itemModelMapper.mapToItemModel(i))),
      shareReplay(1)
    ).subscribe(items => this.items.push(...items));
  }

  addItemToCart(item: ItemModel, quantityInput: HTMLInputElement) {
    const quantity = parseInt(quantityInput.value);
    quantityInput.value = '1';

    // Make cart service work with ItemModel
    // this.cartService.addItemQuantity(item.model, quantity);
  }

  showItem(item: ItemModel) {
    this.router.navigate(['item', item.id], { relativeTo: this.route });
  }
}
