import { Component } from '@angular/core';
import { faCartShopping } from '@fortawesome/free-solid-svg-icons';
import { BigNumber } from 'ethers';
import { Observable } from 'rxjs';
import { filter, map, mergeMap, shareReplay, tap } from 'rxjs/operators';
import { CartService, ProviderService, ShopItem, ShopServiceFactory } from 'src/app/core';
import { Price } from '../price/price';

interface ItemView {
  id: number;
  price: Price;
  mime: string;
  name: string;
  description: string;
  model: ShopItem;
}

@Component({
  selector: 'app-collection',
  templateUrl: './items.component.html',
  styleUrls: ['./items.component.scss']
})
export class ItemsComponent {

  faCartShopping = faCartShopping;

  readonly items: ItemView[] = [];
  isWalletConnected$: Observable<boolean> = this.providerService.isWalletConnected$;

  constructor(
    private readonly shopFacadeFactory: ShopServiceFactory,
    private readonly providerService: ProviderService,
    private readonly cartService: CartService
  ) {
    // This might be dangerous as we are doing a bit too much in the ctor which
    // can confuse Angular. But its just simpler to build it here. As long as the
    // shop was resolved that should be fine.
    this.shopFacadeFactory.shopService$.pipe(
      filter(x => !!x),
      map(shop => shop.getItemService()),
      mergeMap(itemsService => itemsService.getItems()),
      map(items => items.map(i => this.toItemView(i))),
      shareReplay(1)
    ).subscribe(items => this.items.push(...items));
  }

  private toItemView(shopItem: ShopItem): ItemView {
    return {
      id: shopItem.id,
      price: {
        currency: shopItem.currency,
        price: BigNumber.from(shopItem.price)
      },
      mime: shopItem.mime,
      name: shopItem.name,
      description: shopItem.description,
      model: shopItem
    }
  }

  addItemToCart(item: ItemView, quantityInput: HTMLInputElement) {
    const quantity = parseInt(quantityInput.value);
    quantityInput.value = '1';

    this.cartService.addItemQuantity(item.model, quantity);
  }
}
