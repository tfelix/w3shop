import { BigNumber, ethers } from 'ethers';
import MerkleTree from 'merkletreejs';

const ZERO = BigNumber.from(0);
const DEFAULT_HASH = sha256Leaf(ZERO, ZERO);

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

  if (leafes.length === 1) {
    leafes.push(DEFAULT_HASH);
  }

  const tree = new MerkleTree(leafes, keccak256Buffered, {
    sort: true,
    duplicateOdd: true,
    fillDefaultHash: DEFAULT_HASH,
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

  if (leafes.length === 1) {
    leafes.push(DEFAULT_HASH);
  }

  const tree = new MerkleTree(leafes, keccak256Buffered, {
    sort: true,
    duplicateOdd: true,
    fillDefaultHash: DEFAULT_HASH,
  });

  const proofLeaves = makeLeafs(proofIds, proofPrices);
  const proof = tree.getMultiProof([0]);
  const proofFlags = tree.getProofFlags(proofLeaves, proof);

  return { proof, proofFlags };
}