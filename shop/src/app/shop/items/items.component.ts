import { Component } from '@angular/core';
import { BigNumber } from 'ethers';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CartService } from 'src/app/core';
import { IdentifiedData, Item, ItemV1 } from 'src/app/shared';
import { Price } from '../price/price';
import { ItemsService } from './items.service';

interface ItemView {
  id: number;
  price: Price;
  mime: string;
  name: string;
  description: string;
  model: IdentifiedData<Item>;
}

@Component({
  selector: 'app-collection',
  templateUrl: './items.component.html',
  styleUrls: ['./items.component.scss']
})
export class ItemsComponent {
  readonly items$: Observable<ItemView[]>;

  constructor(
    private readonly itemsService: ItemsService,
    private readonly cartService: CartService
  ) {
    /* might be handy for later.
    const cId = this.route.paramMap.pipe(
      map(x => x.get('id') ?? '0'),
      map(x => parseInt(x))
    );*/

    this.items$ = this.itemsService.items$.pipe(
      map(is => is.map(i => this.toItemView(i)))
    );
  }

  private toItemView(idItem: IdentifiedData<Item>): ItemView {
    // TODO must be more sophisticated if more then one version exists.
    const itemV1 = idItem.data as ItemV1;
    return {
      id: idItem.id,
      price: {
        currency: itemV1.currency,
        price: BigNumber.from(itemV1.price)
      },
      mime: itemV1.mime,
      name: itemV1.name,
      description: itemV1.description,
      model: idItem
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
