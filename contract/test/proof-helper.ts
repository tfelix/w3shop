import { ethers } from 'hardhat';
import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';
import { BigNumber } from 'ethers';

const ZERO = BigNumber.from(0);

export function bufferKeccak256Leaf(a: BigNumber, b: BigNumber): Buffer {
  const hash = ethers.utils.solidityKeccak256(['uint256', 'uint256'], [a, b]);
  return Buffer.from(hash.slice('0x'.length), 'hex');
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

export function makeMerkleRoot(
  itemIds: BigNumber[],
  itemPrices: BigNumber[]
): string {
  const leafes = makeLeafs(itemIds, itemPrices);
  const tree = new MerkleTree(leafes, keccak256, {
    sort: true,
    duplicateOdd: true,
    fillDefaultHash: bufferKeccak256Leaf(ZERO, ZERO),
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
  const tree = new MerkleTree(leafes, keccak256, {
    sort: true,
    duplicateOdd: true,
    fillDefaultHash: bufferKeccak256Leaf(ZERO, ZERO),
  });

  const proofLeaves = makeLeafs(proofIds, proofPrices);
  const proof = tree.getMultiProof(proofLeaves);
  const proofFlags = tree.getProofFlags(proofLeaves, proof);

  return { proof, proofFlags };
}
