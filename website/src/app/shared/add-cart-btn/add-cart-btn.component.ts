import { Component, Input } from '@angular/core';
import { CartService, ShopItem } from 'src/app/core';

@Component({
  selector: 'w3s-add-cart-btn',
  templateUrl: './add-cart-btn.component.html',
  styleUrls: ['./add-cart-btn.component.scss']
})
export class AddCartBtnComponent {

  @Input()
  quantity: HTMLInputElement

  @Input()
  shopItem: ShopItem;

  constructor(
    private readonly cartService: CartService
  ) { }

  addItemToCart() {
    const quantity = parseInt(this.quantity.value);
    this.quantity.value = '1';
    // FIXME Adapt to new shop item model
    // this.cartService.addItemQuantity(this.shopItem, quantity);
  }
}
