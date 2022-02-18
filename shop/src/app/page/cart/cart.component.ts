import { Component } from '@angular/core';
import { Observable } from 'rxjs';

import { faCartShopping } from '@fortawesome/free-solid-svg-icons';

import { CartService, BootstrapService } from 'src/app/core';

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
