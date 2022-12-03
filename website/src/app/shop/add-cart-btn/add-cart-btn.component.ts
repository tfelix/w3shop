import { Component, Input } from '@angular/core';
import { CartService } from 'src/app/shop/cart.service';
import { ShopItem } from '../shop-item';

@Component({
  selector: 'w3s-add-cart-btn',
  templateUrl: './add-cart-btn.component.html',
  styleUrls: ['./add-cart-btn.component.scss']
})
export class AddCartBtnComponent {

  @Input()
  quantity: HTMLInputElement;

  @Input()
  shopItem: ShopItem;

  constructor(
    private readonly cartService: CartService
  ) { }

  addItemToCart() {
    const quantity = parseInt(this.quantity.value);
    this.quantity.value = '1';
    this.cartService.addItemQuantity(this.shopItem, quantity);
  }
}