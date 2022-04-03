import { ethers } from 'hardhat';
import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';

export function bufferKeccak256Leaf(a: number, b: number): Buffer {
  const hash = ethers.utils.solidityKeccak256(['uint256', 'uint256'], [a, b]);
  return Buffer.from(hash.slice('0x'.length), 'hex');
}

export function makeLeafs(itemIds: number[], itemPrices: number[]): Buffer[] {
  const leafes = [];
  for (let i = 0; i < itemIds.length; i++) {
    const hash = bufferKeccak256Leaf(itemIds[i], itemPrices[i]);
    leafes.push(hash);
  }

  return leafes.sort(Buffer.compare);
}

export function makeMerkleRoot(
  itemIds: number[],
  itemPrices: number[]
): string {
  const leafes = makeLeafs(itemIds, itemPrices);
  const tree = new MerkleTree(leafes, keccak256, {
    sort: true,
    duplicateOdd: true,
    fillDefaultHash: bufferKeccak256Leaf(0, 0),
  });

  const hexRoot = tree.getHexRoot();
  return hexRoot;
}

export function makeMerkleProof(
  itemIds: number[],
  itemPrices: number[],
  proofIds: number[],
  proofPrices: number[]
): { proof: Buffer[]; proofFlags: boolean[] } {
  const leafes = makeLeafs(itemIds, itemPrices);
  const tree = new MerkleTree(leafes, keccak256, {
    sort: true,
    duplicateOdd: true,
    fillDefaultHash: bufferKeccak256Leaf(0, 0),
  });

  const proofLeaves = makeLeafs(proofIds, proofPrices);
  const proof = tree.getMultiProof(proofLeaves);
  const proofFlags = tree.getProofFlags(proofLeaves, proof);

  return { proof, proofFlags };
}
