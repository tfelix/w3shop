import { Component } from '@angular/core';
import { Observable } from 'rxjs';

import { faCartShopping } from '@fortawesome/free-solid-svg-icons';

import { CartService, IssueService, ShopServiceFactory } from 'src/app/core';
import { pluck } from 'rxjs/operators';

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
    private readonly shopFacadeFactory: ShopServiceFactory,
    private readonly cartService: CartService,
    private readonly issueService: IssueService
  ) {
    this.itemsInCart$ = this.cartService.itemCount$;
    this.shopIdentifier$ = this.shopFacadeFactory.shopService$.pipe(pluck('identifier'));
  }
}
