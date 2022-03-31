import { Component, Inject } from '@angular/core';
import { Observable } from 'rxjs';

import { faCartShopping } from '@fortawesome/free-solid-svg-icons';

import { CartService, ShopService } from 'src/app/core';

@Component({
  selector: 'w3s-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent {
  faCartShopping = faCartShopping;

  itemsInCart$: Observable<number>;
  shopIdentifier$: Observable<string>;

  constructor(
    @Inject('Shop') private readonly shopService: ShopService,
    private readonly cartService: CartService
  ) {
    this.itemsInCart$ = this.cartService.itemCount$;
    this.shopIdentifier$ = this.shopService.identifier$;
  }
}
