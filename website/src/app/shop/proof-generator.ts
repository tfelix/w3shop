import { BigNumber, ethers } from 'ethers';
import MerkleTree from 'merkletreejs';
import { Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { ShopService } from '../core';

function keccak256Pair(a: BigNumber, b: BigNumber): string {
  return ethers.utils.solidityKeccak256(['uint256', 'uint256'], [a, b]);
}

function stringToBuffer(data: string): Buffer {
  return Buffer.from(data.slice('0x'.length), 'hex');
}

/**
 * The MerkleTree implementation requires a function that generates a hash and returns a
 * buffer.
 */
function merkleKeccak256(value: Buffer): Buffer {
  const hash = ethers.utils.keccak256(value);
  return stringToBuffer(hash);
}

function generateLeafBuffers(itemIds: BigNumber[], itemPrices: BigNumber[]): Buffer[] {
  const leafes = [];
  for (let i = 0; i < itemIds.length; i++) {
    const hash = stringToBuffer(keccak256Pair(itemIds[i], itemPrices[i]));
    leafes.push(hash);
  }
  leafes.sort(Buffer.compare);

  return leafes;
}

function generateMerkleTree(itemIds: BigNumber[], itemPrices: BigNumber[]): MerkleTree {
  if (itemIds.length !== itemPrices.length) {
    throw new Error('ItemIds and ItemPrices are not of equal length');
  }

  const leafes = generateLeafBuffers(itemIds, itemPrices);

  return new MerkleTree(leafes, merkleKeccak256, { sort: true });
}

export interface Multiproof {
  proofLeaves: Buffer[];
  proof: Buffer[];
  proofFlags: boolean[]
}

export function generateMerkleRoot(itemIds: BigNumber[], itemPrices: BigNumber[]): string {
  const tree = generateMerkleTree(itemIds, itemPrices);

  return tree.getHexRoot();
}

export function generateMerkleMultiProof(
  itemIds: BigNumber[],
  itemPrices: BigNumber[],
  proofItemIds: BigNumber[],
  proofItemPrices: BigNumber[]
): Multiproof {
  if (itemIds.length !== itemPrices.length) {
    throw new Error('itemIds and itemPrices are not of equal length');
  }
  if (proofItemIds.length !== proofItemPrices.length) {
    throw new Error('proofItemIds and proofItemPrices are not of equal length');
  }

  const tree = generateMerkleTree(itemIds, itemPrices);

  const proofLeaves = generateLeafBuffers(proofItemIds, proofItemPrices);
  const proof = tree.getMultiProof(proofLeaves)
  const proofFlags = tree.getProofFlags(proofLeaves, proof)

  return { proofLeaves, proof, proofFlags };
}

export function generateMerkleRootFromShop(shop: ShopService): Observable<string> {
  return shop.items$.pipe(
    mergeMap(is => is.getItems()),
    map(items => {
      const itemIds = items.map(i => BigNumber.from(i.id));
      const itemPrices = items.map(i => BigNumber.from(i.price));

      return generateMerkleRoot(itemIds, itemPrices);
    })
  )
}