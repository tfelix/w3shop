import { BigNumber, ethers } from 'ethers';
import { BytesLike, keccak256 } from 'ethers/lib/utils';
import MerkleTree from 'merkletreejs';
import { Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { ShopService } from '../core';

const ZERO = BigNumber.from(0);

function stringToBuffer(data: string): Buffer {
  return Buffer.from(data.slice('0x'.length), 'hex');
}

/**
 * The MerkleTree implementation requires a function that generates a hash and returns a
 * buffer.
 */
function bufferKeccak256Leaf(a: BigNumber, b: BigNumber): Buffer {
  const hash = ethers.utils.solidityKeccak256(['uint256', 'uint256'], [a, b]);
  return stringToBuffer(hash);
}

function bufferedKeccak256(data: BytesLike): Buffer {
  return stringToBuffer(keccak256(data));
}

export function makeLeafs(
  itemIds: BigNumber[],
  itemPrices: BigNumber[]
): Buffer[] {
  const leafes = [];
  for (let i = 0; i < itemIds.length; i++) {
    const hash = bufferKeccak256Leaf(itemIds[i], itemPrices[i]);
    leafes.push(hash);
  }

  return leafes.sort(Buffer.compare);
}

function generateMerkleTree(itemIds: BigNumber[], itemPrices: BigNumber[]): MerkleTree {
  if (itemIds.length !== itemPrices.length) {
    throw new Error('ItemIds and ItemPrices are not of equal length');
  }

  const leafes = makeLeafs(itemIds, itemPrices);
  return new MerkleTree(leafes, bufferedKeccak256, {
    sort: true,
    duplicateOdd: true,
    fillDefaultHash: bufferKeccak256Leaf(ZERO, ZERO),
  });
}

export interface Multiproof {
  proofLeaves: Buffer[];
  proof: Buffer[];
  proofFlags: boolean[]
}

export function makeMerkleRoot(
  itemIds: BigNumber[],
  itemPrices: BigNumber[]
): string {
  const leafes = makeLeafs(itemIds, itemPrices);

  const tree = new MerkleTree(leafes, bufferedKeccak256, {
    sort: true,
    duplicateOdd: true,
    fillDefaultHash: bufferKeccak256Leaf(ZERO, ZERO),
  });

  const hexRoot = tree.getHexRoot();

  return hexRoot;
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

  const proofLeaves = makeLeafs(proofItemIds, proofItemPrices);
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

      return makeMerkleRoot(itemIds, itemPrices);
    })
  )
}