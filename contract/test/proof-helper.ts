import { ethers } from 'hardhat';
import { MerkleTree } from 'merkletreejs';
import { BigNumber } from 'ethers';

const ZERO = BigNumber.from(0);

export function toBigNumbers(n: number[]): BigNumber[] {
  return n.map((x) => BigNumber.from(x));
}

export function sha256Leaf(itemId: BigNumber, price: BigNumber): Buffer {
  const encoded = ethers.utils.defaultAbiCoder.encode(['uint256', 'uint256'], [itemId, price]);
  const hash = ethers.utils.sha256(encoded);

  return Buffer.from(hash.slice('0x'.length), 'hex');
}

export function keccak256Buffered(value: Buffer | string): Buffer {
  const hash = ethers.utils.keccak256(value);

  return Buffer.from(hash.slice('0x'.length), 'hex');
}

export function makeLeafs(
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

export function makeMerkleRoot(
  itemIds: BigNumber[],
  itemPrices: BigNumber[]
): string {
  const leafes = makeLeafs(itemIds, itemPrices);
  const tree = new MerkleTree(leafes, keccak256Buffered, {
    sort: true,
    duplicateOdd: true,
    fillDefaultHash: sha256Leaf(ZERO, ZERO),
  });

  const hexRoot = tree.getHexRoot();
  return hexRoot;
}

export function makeMerkleProof(
  itemIds: BigNumber[],
  itemPrices: BigNumber[],
  proofIds: BigNumber[],
  proofPrices: BigNumber[]
): { proof: Buffer[]; proofFlags: boolean[] } {
  const leafes = makeLeafs(itemIds, itemPrices);
  const tree = new MerkleTree(leafes, keccak256Buffered, {
    sort: true,
    duplicateOdd: true,
    fillDefaultHash: sha256Leaf(ZERO, ZERO),
  });

  const proofLeaves = makeLeafs(proofIds, proofPrices);
  const proof = tree.getMultiProof(proofLeaves);
  const proofFlags = tree.getProofFlags(proofLeaves, proof);

  return { proof, proofFlags };
}
