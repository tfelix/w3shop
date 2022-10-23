import { Injectable } from "@angular/core";
import { BigNumber, ethers } from "ethers";
import MerkleTree from "merkletreejs";
import { ShopItem } from "../core";


function sha256Leaf(itemId: BigNumber, price: BigNumber): Buffer {
  const encoded = ethers.utils.defaultAbiCoder.encode(['uint256', 'uint256'], [itemId, price]);
  const hash = ethers.utils.sha256(encoded);

  return Buffer.from(hash.slice('0x'.length), 'hex');
}

function keccak256Buffered(value: Buffer | string): Buffer {
  const hash = ethers.utils.keccak256(value);

  return Buffer.from(hash.slice('0x'.length), 'hex');
}

export interface Multiproof {
  proofLeaves: Buffer[];
  proof: Buffer[];
  proofFlags: boolean[]
}

@Injectable({
  providedIn: 'root'
})
export class ProofGeneratorService {

  constructor() {
    console.log('build');
  }

  private readonly ZERO = BigNumber.from(0);

  private makeLeafs(
    itemIds: BigNumber[],
    itemPrices: BigNumber[]
  ): Buffer[] {
    const leafes = [];
    for (let i = 0; i < itemIds.length; i++) {
      const hash = sha256Leaf(itemIds[i], itemPrices[i]);
      leafes.push(hash);
    }

    return leafes.sort(Buffer.compare);
  }

  private generateMerkleTree(itemIds: BigNumber[], itemPrices: BigNumber[]): MerkleTree {
    if (itemIds.length !== itemPrices.length) {
      throw new Error('ItemIds and ItemPrices are not of equal length');
    }

    const leafes = this.makeLeafs(itemIds, itemPrices);
    return new MerkleTree(leafes, keccak256Buffered, {
      sort: true,
      duplicateOdd: true,
      fillDefaultHash: sha256Leaf(this.ZERO, this.ZERO),
    });
  }

  private makeMerkleRoot(
    itemIds: BigNumber[],
    itemPrices: BigNumber[]
  ): string {
    const tree = this.generateMerkleTree(itemIds, itemPrices)
    const hexRoot = tree.getHexRoot();

    return hexRoot;
  }

  generateMerkleRoot(items: ShopItem[]): string {
    const itemIds = items.map(i => BigNumber.from(i.id));
    const itemPrices = items.map(i => BigNumber.from(i.price));

    return this.makeMerkleRoot(itemIds, itemPrices);
  }

  generateMerkleMultiProof(
    items: ShopItem[],
    itemsToBuy: ShopItem[]
  ): Multiproof {
    const itemIds = items.map(i => BigNumber.from(i.id));
    const itemPrices = items.map(i => BigNumber.from(i.price));

    const proofItemIds = itemsToBuy.map(i => BigNumber.from(i.id));
    const proofItemPrices = itemsToBuy.map(i => BigNumber.from(i.price));

    const tree = this.generateMerkleTree(itemIds, itemPrices);
    const proofLeaves = this.makeLeafs(proofItemIds, proofItemPrices);
    const proof = tree.getMultiProof(proofLeaves)
    const proofFlags = tree.getProofFlags(proofLeaves, proof)

    return { proofLeaves, proof, proofFlags };
  }
}