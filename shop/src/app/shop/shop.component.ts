import { Component } from '@angular/core';
import * as sha256 from 'crypto-js/sha256';
import { BigNumber } from 'ethers';

import MerkleTree from 'merkletreejs';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { CollectionId, CollectionV1, ItemV1 } from 'src/app/shared';
import { CollectionsService } from './collections.service';
import { PriceView } from './price/price.component';


interface CollectionView {
  id: number;
  name: string;
  tags: string[];
  creationDate: Date;
  thumbnail: string;
  price: PriceView;
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
  }

  private makeView(c: CollectionId): CollectionView {
    // TODO Collections can only have one currency for all item!
    const c1 = c.collection as CollectionV1;
    const totalPrice = c1.items
      .map(i => i as ItemV1)
      .map(i => BigNumber.from(i.price))
      .reduce((a, b) => a.add(b));
    return {
      id: c.id,
      name: c1.name,
      tags: c1.tags,
      thumbnail: c1.thumbnail,
      creationDate: new Date(c1.creationDate),
      price: {
        currency: 'ETH',
        price: totalPrice
      }
    }
  }
}


