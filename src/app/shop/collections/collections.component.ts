import { Component } from '@angular/core';
import * as sha256 from 'crypto-js/sha256';
import { BigNumber } from 'ethers';

import MerkleTree from 'merkletreejs';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { CollectionV1, ItemV1 } from 'src/app/shared';
import { PriceView } from '../price/price.component';

import { CollectionsService } from './collections.service';

interface CollectionView {
  name: string;
  tags: string[];
  creationDate: Date;
  thumbnail: string;
  price: PriceView;
}

@Component({
  selector: 'w3s-collections',
  templateUrl: './collections.component.html',
  styleUrls: ['./collections.component.scss']
})
export class CollectionsComponent {

  collections$: Observable<CollectionView[]>

  constructor(
    bootstrapService: CollectionsService,
  ) {
    this.collections$ = bootstrapService.collections$.pipe(
      map(x => x.filter(x => x.version == '1') as CollectionV1[]),
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

  private makeView(c: CollectionV1): CollectionView {
    // TODO Collections can only have one currency for all item!
    const totalPrice = c.items
      .map(i => i as ItemV1)
      .map(i => BigNumber.from(i.price))
      .reduce((a, b) => a.add(b));
    return {
      name: c.name,
      tags: c.tags,
      thumbnail: c.thumbnail,
      creationDate: new Date(c.creationDate),
      price: {
        currency: 'ETH',
        price: totalPrice
      }
    }
  }
}


