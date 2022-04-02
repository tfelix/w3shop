import { Component, Inject } from '@angular/core';
import { BigNumber } from 'ethers';
import { Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { CartService, ShopService } from 'src/app/core';
import { ShopItem } from 'src/app/shared';
import { Price } from '../price/price';

interface ItemView {
  id: number;
  price: Price;
  mime: string;
  name: string;
  description: string;
  model: ShopItem;
}

@Component({
  selector: 'app-collection',
  templateUrl: './items.component.html',
  styleUrls: ['./items.component.scss']
})
export class ItemsComponent {
  readonly items$: Observable<ItemView[]>;

  constructor(
    @Inject('Shop') private readonly shopService: ShopService,
    private readonly cartService: CartService
  ) {
    // This might be dangerous as we are doing a bit too much in the ctor which
    // can confuse Angular. But its just simpler to build it here. As long as the
    // shop was resolved that should be fine.
    this.items$ = this.shopService.buildItemsService().pipe(
      mergeMap(shopService => shopService.getItems()),
      map(shopItems => shopItems.map(si => this.toItemView(si)))
    );
  }

  private toItemView(shopItem: ShopItem): ItemView {
    return {
      id: shopItem.id,
      price: {
        currency: shopItem.currency,
        price: BigNumber.from(shopItem.price)
      },
      mime: shopItem.mime,
      name: shopItem.name,
      description: shopItem.description,
      model: shopItem
    }
  }

  addItemToCart(item: ItemView, quantityInput: HTMLInputElement) {
    const quantity = parseInt(quantityInput.value);
    quantityInput.value = '1';

    this.cartService.addItemQuantity(item.model, quantity);
  }

  /*
  test() {
    const leaves = [
      'c:0/i:0/1234500:ETH',
      'c:0/i:1/1234500:ETH',
      'c:1/i:0/66666666:ETH',
      'c:1/i:1/12345677:ETH',
      'c:3/i:0/66666666:ETH'
    ].map(x => sha256(x));
    const tree = new MerkleTree(leaves, sha256);
    const leaf = sha256('c:1/i:0/66666666:ETH').toString();
    const proof = tree.getProof(leaf)
    console.log(proof);
    console.log(tree.toString());
  }*/
}
