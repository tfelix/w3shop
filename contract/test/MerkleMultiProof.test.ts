import { expect } from 'chai';
import { ethers, deployments } from 'hardhat';
import { MerkleMultiProof } from '../typechain';
import { makeLeafs, makeMerkleProof, makeMerkleRoot, toBigNumbers } from './proof-helper';

const itemIdsNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const itemPricesNumbers = [
  12000000000, 30000000000, 51200000000, 1005600000, 100078200000, 10000000000,
  10000000000, 10000000000, 30000000000, 45600000000,
];

const itemIds = toBigNumbers(itemIdsNumbers);
const itemPrices = toBigNumbers(itemPricesNumbers);

describe('MerkleMultiProof library', function () {
  let sut: MerkleMultiProof;
  // Calculate valid merkle root
  const root = makeMerkleRoot(itemIds, itemPrices);

  this.beforeAll(async function () {
    await deployments.fixture(['MerkleMultiProof']);
    sut = await ethers.getContract('MerkleMultiProof');
  });

  for (let i = 0; i < itemIds.length; i++) {
    it(`Verifies a single item: ${itemIds[i]}:${itemPrices[i]}`, async function () {
      const proofLeaves = makeLeafs([itemIds[i]], [itemPrices[i]]);
      const { proof, proofFlags } = makeMerkleProof(
        itemIds,
        itemPrices,
        [itemIds[i]],
        [itemPrices[i]]
      );

      const result = await sut.verify(root, proofLeaves, proof, proofFlags);
      expect(result).to.be.true;
    });
  }

  it('Verifies multiple items sucessfully', async function () {
    const proofItemsIds = toBigNumbers([1, 3, 8, 10]);
    const proofItemPrices = toBigNumbers([
      12000000000, 51200000000, 10000000000, 45600000000,
    ]);
    const proofLeafs = makeLeafs(proofItemsIds, proofItemPrices);
    const { proof, proofFlags } = makeMerkleProof(
      itemIds,
      itemPrices,
      proofItemsIds,
      proofItemPrices
    );

    const result = await sut.verify(root, proofLeafs, proof, proofFlags);

    expect(result).to.be.true;
  });

  it('Fails to verify items when the root is wrong', async function () {
    const differentRoot = makeMerkleRoot(
      toBigNumbers([1337, 1338]),
      toBigNumbers([999999999, 88888888])
    );
    const proofLeafs = makeLeafs(
      toBigNumbers([3]),
      toBigNumbers([51200000000])
    );
    const { proof, proofFlags } = makeMerkleProof(
      itemIds,
      itemPrices,
      toBigNumbers([3]),
      toBigNumbers([51200000000])
    );

    const result = await sut.verify(
      differentRoot,
      proofLeafs,
      proof,
      proofFlags
    );

    expect(result).to.be.false;
  });

  it('Fails to verify items when one of the leafs item ids is wrong', async function () {
    const proofItemsIds = toBigNumbers([5, 7]);
    const proofItemPrices = toBigNumbers([100078200000, 10000000000]);
    const { proof, proofFlags } = makeMerkleProof(
      itemIds,
      itemPrices,
      proofItemsIds,
      proofItemPrices
    );

    const faultyProofLeafs = makeLeafs(toBigNumbers([6, 7]), proofItemPrices);

    const result = await sut.verify(root, faultyProofLeafs, proof, proofFlags);

    expect(result).to.be.false;
  });

  it('Fails to verify items when one of the leafs item prices is wrong', async function () {
    const proofItemsIds = toBigNumbers([5, 7]);
    const proofItemPrices = toBigNumbers([100078200000, 10000000000]);
    const { proof, proofFlags } = makeMerkleProof(
      itemIds,
      itemPrices,
      proofItemsIds,
      proofItemPrices
    );

    const faultyProofLeafs = makeLeafs(
      proofItemsIds,
      toBigNumbers([100078200000, 11000000000])
    );

    const result = await sut.verify(root, faultyProofLeafs, proof, proofFlags);

    expect(result).to.be.false;
  });
});
