import { Component, Input } from '@angular/core';
import { CartService } from 'src/app/core';
import { ItemModel } from 'src/app/shop/items/item-model';

@Component({
  selector: 'w3s-add-cart-btn',
  templateUrl: './add-cart-btn.component.html',
  styleUrls: ['./add-cart-btn.component.scss']
})
export class AddCartBtnComponent {

  @Input()
  quantity: HTMLInputElement

  @Input()
  shopItem: ItemModel;

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
