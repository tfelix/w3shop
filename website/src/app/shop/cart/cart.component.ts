import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

import { faCartShopping } from '@fortawesome/free-solid-svg-icons';

import { CartService, NavService } from 'src/app/core';
import { map } from 'rxjs/operators';

@Component({
  selector: 'w3s-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {
  faCartShopping = faCartShopping;

  itemsInCart$: Observable<number>;
  shopIdentifier$: Observable<string>;

  constructor(
    private readonly cartService: CartService,
    private readonly navService: NavService
  ) {
    this.itemsInCart$ = this.cartService.itemCount$;
  }

  ngOnInit(): void {
    this.shopIdentifier$ = this.navService.navInfo$.pipe(
      map(s => s.shopIdentifier)
    );
  }
}
