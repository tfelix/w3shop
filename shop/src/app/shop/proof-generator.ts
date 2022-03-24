import { ethers } from 'ethers';
import MerkleTree from 'merkletreejs';

function keccak256Pair(a: number, b: number): string {
  return ethers.utils.keccak256([a, b]);
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

function generateLeafBuffers(itemIds: number[], itemPrices: number[]): Buffer[] {
  const leafes = [];
  for (let i = 0; i < itemIds.length; i++) {
    const hash = stringToBuffer(keccak256Pair(itemIds[i], itemPrices[i]));
    leafes.push(hash);
  }
  leafes.sort(Buffer.compare);

  return leafes;
}

function generateMerkleTree(itemIds: number[], itemPrices: number[]): MerkleTree {
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

export function generateMerkleRoot(itemIds: number[], itemPrices: number[]): string {
  const tree = generateMerkleTree(itemIds, itemPrices);

  return tree.getHexRoot();
}

export function generateMerkleMultiProof(
  itemIds: number[],
  itemPrices: number[],
  proofItemIds: number[],
  proofItemPrices: number[]
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