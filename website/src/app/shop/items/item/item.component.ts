import { Component, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { faCartPlus } from '@fortawesome/free-solid-svg-icons';
import { CartService } from '../../cart.service';
import { ShopItem } from '../../shop-item';

@Component({
  selector: 'w3s-item',
  templateUrl: './item.component.html',
  styleUrls: ['./item.component.scss']
})
export class ItemComponent {

  @Input()
  item!: ShopItem;

  faAddCart = faCartPlus;

  constructor(
    private readonly cartService: CartService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) { }

  addItemToCart() {
    this.cartService.addItemQuantity(this.item, 1);
  }

  showItem(item: ShopItem) {
    this.router.navigate(['item', item.id], { relativeTo: this.route });
  }
}
