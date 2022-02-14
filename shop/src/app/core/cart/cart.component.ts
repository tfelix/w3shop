import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { BootstrapService } from 'src/app/shared';

import { faCartShopping } from '@fortawesome/free-solid-svg-icons';

import { CartService } from 'src/app/shop/cart.service';

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
    private readonly bootstrapService: BootstrapService,
    private readonly cartService: CartService
  ) {
    this.itemsInCart$ = this.cartService.itemCount$;
    this.shopIdentifier$ = this.bootstrapService.shopIdentifier$;
  }
}
