import { StandardMerkleTree } from '@openzeppelin/merkle-tree';

const LEAF_FORMAT = ['uint256', 'uint256'];

export interface MultiProof<T, L = T> {
  leaves: L[];
  proof: T[];
  proofFlags: boolean[];
}

export function toBigNumbers(n: number[]): BigInt[] {
  return n.map((x) => BigInt(x));
}

export function makeLeafs(
  itemIds: BigInt[],
  itemPrices: BigInt[]
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
  itemIds: BigInt[],
  itemPrices: BigInt[]
): string {
  const leafes = makeLeafs(itemIds, itemPrices);
  const tree = StandardMerkleTree.of(leafes, LEAF_FORMAT);

  return tree.root;
}

export function makeMerkleProof(
  itemIds: BigInt[],
  itemPrices: BigInt[],
  proofIds: BigInt[],
  proofPrices: BigInt[]
): MultiProof<string, string[]> {
  const leafes = makeLeafs(itemIds, itemPrices);
  const tree = StandardMerkleTree.of(leafes, LEAF_FORMAT);
  const proofLeaves = makeLeafs(proofIds, proofPrices);

  return tree.getMultiProof(proofLeaves);
}
