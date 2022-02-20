import { Component } from '@angular/core';
import { BigNumber } from 'ethers';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { IdentifiedCollection, CollectionV1, ItemV1 } from 'src/app/shared';
import { CollectionsService } from './collections.service';
import { Price, sumPrices } from './price/price';


interface CollectionView {
  id: number;
  name: string;
  tags: string[];
  creationDate: Date;
  thumbnail: string;
  price: Price;
}

@Component({
  templateUrl: './shop.component.html',
})
export class ShopComponent {
  collections$: Observable<CollectionView[]>

  constructor(
    bootstrapService: CollectionsService,
  ) {
    this.collections$ = bootstrapService.collections$.pipe(
      map(x => x.filter(x => x.collection.version == '1')),
      map(x => x.map(x => this.makeView(x)))
    );
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

  private makeView(c: IdentifiedCollection): CollectionView {
    // TODO Collections can only have one currency for all item!
    const c1 = c.collection as CollectionV1;
    const totalPrice = sumPrices(c1.items
      .map(i => i as ItemV1)
      .map(i => ({ currency: i.currency, price: BigNumber.from(i.price) })))

    return {
      id: c.id,
      name: c1.name,
      tags: c1.tags,
      thumbnail: c1.thumbnail,
      creationDate: new Date(c1.creationDate),
      price: totalPrice
    }
  }
}


