import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { CartService } from 'src/app/shop/cart.service';

@Component({
  selector: 'w3s-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {

  itemsInCart$: Observable<number>;

  constructor(
    private readonly cartService: CartService
  ) {
    this.itemsInCart$ = this.cartService.itemCount$;
  }

  ngOnInit(): void {
  }

}
