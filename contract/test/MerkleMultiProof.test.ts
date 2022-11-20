import { expect } from 'chai';
import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';
import { MerkleMultiProof } from '../typechain-types';
import { makeMerkleProof, makeMerkleRoot, toBigNumbers } from './proof-helper';

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
    const MerkleMultiProof = await ethers.getContractFactory('MerkleMultiProof');
    const merkleProof = (await MerkleMultiProof.deploy()) as MerkleMultiProof;
    await merkleProof.deployed();

    sut = merkleProof;
  });

  it(`Verifies a single item in a single item tree`, async function () {
    const itemId = BigNumber.from(1);
    const itemPrice = BigNumber.from(1000);
    const root = makeMerkleRoot([itemId, BigNumber.from(0)], [itemPrice, BigNumber.from(0)]);

    const { proof, proofFlags } = makeMerkleProof(
      [itemId],
      [itemPrice],
      [itemId],
      [itemPrice]
    );

    const result = await sut.verify(root, [itemId], [itemPrice], proof, proofFlags);

    expect(result).to.be.true;
  });

  for (let i = 0; i < itemIds.length; i++) {
    it(`Verifies a single item: ${itemIds[i]}:${itemPrices[i]}`, async function () {
      const { proof, proofFlags } = makeMerkleProof(
        itemIds,
        itemPrices,
        [itemIds[i]],
        [itemPrices[i]]
      );

      const result = await sut.verify(root, [itemIds[i]], [itemPrices[i]], proof, proofFlags);

      expect(result).to.be.true;
    });
  }

  it('Verifies multiple items sucessfully', async function () {
    const proofItemsIds = toBigNumbers([1, 3, 8, 10]);
    const proofItemPrices = toBigNumbers([
      12000000000, 51200000000, 10000000000, 45600000000,
    ]);
    const { proof, proofFlags, leaves } = makeMerkleProof(
      itemIds,
      itemPrices,
      proofItemsIds,
      proofItemPrices
    );

    const result = await sut.verify(root, proofItemsIds, proofItemPrices, proof, proofFlags);

    expect(result).to.be.true;
  });


  it('Fails to verify items when the root is wrong', async function () {
    const differentRoot = makeMerkleRoot(
      toBigNumbers([1337, 1338]),
      toBigNumbers([999999999, 88888888])
    );

    const itemIds = toBigNumbers([3]);
    const itemPrices = toBigNumbers([51200000000]);

    const { proof, proofFlags } = makeMerkleProof(
      itemIds,
      itemPrices,
      itemIds,
      itemPrices
    );

    const result = await sut.verify(
      differentRoot,
      itemIds,
      itemPrices,
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

    const faultyProofItemsIds = toBigNumbers([6, 7]);

    const result = await sut.verify(root, faultyProofItemsIds, proofItemPrices, proof, proofFlags);

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

    const faultItemPrices = toBigNumbers([100078200000, 11000000000]);

    const result = await sut.verify(root, proofItemsIds, faultItemPrices, proof, proofFlags);

    expect(result).to.be.false;
  });
});
