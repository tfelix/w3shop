import { Component, Inject } from '@angular/core';
import { faCartShopping } from '@fortawesome/free-solid-svg-icons';
import { BigNumber } from 'ethers';
import { Observable, of } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { CartService, ShopFacade, ShopFacadeFactory } from 'src/app/core';
import { ShopItem } from 'src/app/shared';
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

  readonly items$: Observable<ItemView[]> = of([]);

  constructor(
    private readonly shopFacadeFactory: ShopFacadeFactory,
    private readonly cartService: CartService
  ) {
    // This might be dangerous as we are doing a bit too much in the ctor which
    // can confuse Angular. But its just simpler to build it here. As long as the
    // shop was resolved that should be fine.
    this.items$ = this.shopFacadeFactory.build().buildItemsService().pipe(
      mergeMap(shopService => shopService.getItems()),
      map(shopItems => shopItems.map(si => this.toItemView(si)))
    );
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
