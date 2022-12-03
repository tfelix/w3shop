import { BigNumber } from 'ethers';

import { StandardMerkleTree } from '@openzeppelin/merkle-tree';

const LEAF_FORMAT = ['uint256', 'uint256'];

export interface MultiProof<T, L = T> {
  leaves: L[];
  proof: T[];
  proofFlags: boolean[];
}

export function toBigNumbers(n: number[]): BigNumber[] {
  return n.map((x) => BigNumber.from(x));
}

export function makeLeafs(
  itemIds: BigNumber[],
  itemPrices: BigNumber[]
): string[][] {
  if (itemIds.length != itemPrices.length) {
    throw new Error('Unequal itemIds and itemPrices lengths');
  }

  const leafes = [];
  for (let i = 0; i < itemIds.length; i++) {
    leafes.push([itemIds[i].toString(), itemPrices[i].toString()]);
  }

  return leafes;
}

export function makeMerkleRoot(
  itemIds: BigNumber[],
  itemPrices: BigNumber[]
): string {
  const leafes = makeLeafs(itemIds, itemPrices);
  const tree = StandardMerkleTree.of(leafes, LEAF_FORMAT);

  return tree.root;
}

export function makeMerkleProof(
  itemIds: BigNumber[],
  itemPrices: BigNumber[],
  proofIds: BigNumber[],
  proofPrices: BigNumber[]
): MultiProof<string, string[]> {
  const leafes = makeLeafs(itemIds, itemPrices);
  const tree = StandardMerkleTree.of(leafes, LEAF_FORMAT);
  const proofLeaves = makeLeafs(proofIds, proofPrices);

  return tree.getMultiProof(proofLeaves);
}
