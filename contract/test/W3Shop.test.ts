import { expect } from 'chai';
import { BigNumber } from 'ethers';
import {
  deployments,
  ethers,
  getNamedAccounts,
  getUnnamedAccounts,
} from 'hardhat';
import { W3Shop } from '../typechain';
import { makeMerkleProof, makeMerkleRoot } from './proof-helper';

const itemIdsNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const itemPricesNumbers = [
  12000000000, 30000000000, 50000000000, 1005600000, 100078200000, 10000000000,
  10000000000, 10000000000, 30000000000, 45600000000,
];

const itemIds = itemIdsNumbers.map((id) => BigNumber.from(id));
const itemPrices = itemPricesNumbers.map((prices) => BigNumber.from(prices));

const arweaveId1 = 'ar://AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const arweaveId2 = 'ar://BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB';
const validItemsRoot = makeMerkleRoot(itemIds, itemPrices);

async function buyItem(
  sut: W3Shop,
  amounts: number[],
  proofItemsIds: BigNumber[],
  proofItemPrices: BigNumber[]
) {
  const { proof, proofFlags } = makeMerkleProof(
    itemIds,
    itemPrices,
    proofItemsIds,
    proofItemPrices
  );

  let totalPrice = BigNumber.from(0);
  for (let i = 0; i < proofItemPrices.length; i++) {
    totalPrice = totalPrice.add(proofItemPrices[i].mul(amounts[i]));
  }

  return sut.buy(amounts, proofItemPrices, proofItemsIds, proof, proofFlags, {
    value: totalPrice,
  });
}

describe('W3Shop', async function () {
  let sut: W3Shop;

  this.beforeAll(async function () {
    await deployments.fixture(['W3Shop']);
    sut = await ethers.getContract('W3Shop');
  });

  it('Mints a special owner NFT when deplyoed', async function () {
    const { shopOwner } = await getNamedAccounts();
    expect(await sut.balanceOf(shopOwner, 0)).to.equal(1);
  });

  it('Returns a proper config URI', async function () {
    expect(await sut.shopConfig()).to.equal(arweaveId1);
  });

  it('Returns a proper URI for the owner NFT', async function () {
    expect(await sut.uri(0)).to.equal(
      'ar://BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB'
    );
  });

  describe('When calling prepareItem', async function () {
    it('reverts as non-owner', async function () {
      const { buyer } = await getNamedAccounts();
      const sutAsBuyer = await ethers.getContract('W3Shop', buyer);
      await expect(sutAsBuyer.prepareItem(1, arweaveId1)).to.be.reverted;
    });

    it('sets URI for non existing token id', async function () {
      const { shopOwner } = await getNamedAccounts();
      const sutAsOwner = await ethers.getContract('W3Shop', shopOwner);
      await sutAsOwner.prepareItem(1, arweaveId1);
      expect(await sutAsOwner.uri(1)).to.equal(arweaveId1);
    });

    it('reverts when skipping one token id', async function () {
      const { shopOwner } = await getNamedAccounts();
      const sutAsOwner = await ethers.getContract('W3Shop', shopOwner);
      await expect(sutAsOwner.prepareItem(3, arweaveId1)).to.be.reverted;
    });

    it('reverts for token id 0', async function () {
      const { shopOwner } = await getNamedAccounts();
      const sutAsOwner = await ethers.getContract('W3Shop', shopOwner);
      await expect(sutAsOwner.prepareItem(0, arweaveId1)).to.be.reverted;
    });

    it('has incremented the next token counter', async function () {
      const { shopOwner } = await getNamedAccounts();
      const sutAsOwner = await ethers.getContract<W3Shop>('W3Shop', shopOwner);
      expect(await sutAsOwner.nextTokenId()).to.equal(2);
    });
  });

  describe('When calling prepareItemBatch', async function () {
    it('reverts as non-owner', async function () {
      const { buyer } = await getNamedAccounts();
      const sutAsBuyer = await ethers.getContract('W3Shop', buyer);
      await expect(sutAsBuyer.prepareItemBatch([1], [arweaveId1])).to.be
        .reverted;
    });

    it('sets URI for multiple, not yet existing token ids', async function () {
      const { shopOwner } = await getNamedAccounts();
      const sutAsOwner = await ethers.getContract<W3Shop>('W3Shop', shopOwner);
      await sutAsOwner.prepareItemBatch(
        [2, 3, 4],
        [arweaveId1, arweaveId1, arweaveId1]
      );
      expect(await sutAsOwner.uri(1)).to.equal(arweaveId1);
      expect(await sutAsOwner.uri(2)).to.equal(arweaveId1);
      expect(await sutAsOwner.uri(3)).to.equal(arweaveId1);
    });

    it('reverts when skipping one token id', async function () {
      const { shopOwner } = await getNamedAccounts();
      const sutAsOwner = await ethers.getContract('W3Shop', shopOwner);

      await expect(
        sutAsOwner.prepareItemBatch([5, 7], [arweaveId1, arweaveId1])
      ).to.be.reverted;
    });

    it('reverts when ids and URIs length mismatch', async function () {
      const { shopOwner } = await getNamedAccounts();
      const sutAsOwner = await ethers.getContract('W3Shop', shopOwner);

      await expect(sutAsOwner.prepareItemBatch([5], [arweaveId1, arweaveId1]))
        .to.be.reverted;
    });

    it('reverts when token id 0 is included', async function () {
      const { shopOwner } = await getNamedAccounts();
      const sutAsOwner = await ethers.getContract('W3Shop', shopOwner);

      await expect(
        sutAsOwner.prepareItemBatch([5, 0], [arweaveId1, arweaveId1])
      ).to.be.reverted;
    });
  });

  describe('When calling setShopConfig', async function () {
    it('reverts as non-owner', async function () {
      const { buyer } = await getNamedAccounts();
      const sutAsBuyer = await ethers.getContract<W3Shop>('W3Shop', buyer);
      await expect(sutAsBuyer.setShopConfig(arweaveId2)).to.be.revertedWith(
        'not owner'
      );
    });

    it('sets the config as owner', async function () {
      const { shopOwner } = await getNamedAccounts();
      const sutAsOwner = await ethers.getContract<W3Shop>('W3Shop', shopOwner);

      await sutAsOwner.setShopConfig(arweaveId2);

      expect(await sutAsOwner.shopConfig()).to.equal(arweaveId2);
    });
  });

  describe('When calling setItemRoot', async function () {
    it('reverts as non-owner', async function () {
      const { buyer } = await getNamedAccounts();
      const sutAsBuyer = await ethers.getContract<W3Shop>('W3Shop', buyer);
      await expect(sutAsBuyer.setItemsRoot(validItemsRoot)).to.be.revertedWith(
        'not owner'
      );
    });

    it('sets the itemRoot as owner', async function () {
      const { shopOwner } = await getNamedAccounts();
      const sutAsOwner = await ethers.getContract<W3Shop>('W3Shop', shopOwner);

      await sutAsOwner.setItemsRoot(validItemsRoot);

      expect(await sutAsOwner.itemsRoot()).to.equal(validItemsRoot);
    });
  });

  describe('When buy is called', async function () {
    const proofItemPrices = [BigNumber.from(50000000000)];
    const proofItemsIds = [BigNumber.from(3)];
    const { proof, proofFlags } = makeMerkleProof(
      itemIds,
      itemPrices,
      proofItemsIds,
      proofItemPrices
    );

    this.beforeAll(async function () {
      const { shopOwner } = await getNamedAccounts();
      const sutAsOwner = await ethers.getContract<W3Shop>('W3Shop', shopOwner);
      await sutAsOwner.setItemsRoot(validItemsRoot);
      expect(await sut.itemsRoot()).to.equal(validItemsRoot);
    });

    it('works when proof and payment is correct', async function () {
      const { buyer } = await getNamedAccounts();
      const sutAsBuyer = await ethers.getContract<W3Shop>('W3Shop', buyer);
      await buyItem(sutAsBuyer, [2], proofItemsIds, proofItemPrices);

      expect(await ethers.provider.getBalance(sutAsBuyer.address)).to.equal(
        50000000000 * 2
      );
      expect(await sut.balanceOf(buyer, 3)).to.equal(2);
    });

    it('reverts when payed correctly but proof is false', async function () {
      const { buyer } = await getNamedAccounts();
      const tx = sut
        .connect(buyer)
        // We call with different item ID
        .buy([2], proofItemPrices, [2], proof, proofFlags, {
          value: 50000000000 * 2,
        });

      await expect(tx).to.be.reverted;
    });

    it('reverts when payed incorrectly', async function () {
      const { buyer } = await getNamedAccounts();
      const sutAsBuyer = await ethers.getContract<W3Shop>('W3Shop', buyer);
      const tx = sutAsBuyer.buy(
        [2],
        proofItemPrices,
        proofItemsIds,
        proof,
        proofFlags,
        {
          value: 48000000000 * 2,
        }
      );
      await expect(tx).to.be.reverted;
    });
  });

  describe('When cashout is called on a contract with funds', async function () {
    const proofItemsIds = [BigNumber.from(3)];
    const proofItemPrices = [BigNumber.from(50000000000)];

    this.beforeAll(async function () {
      const { buyer } = await getNamedAccounts();
      const sutAsBuyer = await ethers.getContract<W3Shop>('W3Shop', buyer);
      await buyItem(sutAsBuyer, [1], proofItemsIds, proofItemPrices);
    });

    it('reverts when from a non owner', async function () {
      const nonOwner = (await getUnnamedAccounts())[0];
      const sutAsNonOwner = await ethers.getContract<W3Shop>(
        'W3Shop',
        nonOwner
      );
      await expect(sutAsNonOwner.cashout(nonOwner)).to.be.reverted;
    });

    it('send all the funds when called from owner', async function () {
      const { shopOwner } = await getNamedAccounts();
      const cashReceiver = (await ethers.getSigners())[1];
      const sutAsOwner = await ethers.getContract<W3Shop>('W3Shop', shopOwner);

      await expect(
        await sutAsOwner.cashout(cashReceiver.address)
      ).to.changeEtherBalances(
        [sutAsOwner, cashReceiver],
        [-150000000000, 150000000000]
      );
    });
  });

  describe('When closeShop is called', async function () {
    this.beforeAll(async function () {
      const { buyer } = await getNamedAccounts();
      const sutAsBuyer = await ethers.getContract<W3Shop>('W3Shop', buyer);
      await buyItem(
        sutAsBuyer,
        [2],
        [BigNumber.from(3)],
        [BigNumber.from(50000000000)]
      );
    });

    it('reverts from non owner', async function () {
      const nonOwner = (await getUnnamedAccounts())[0];
      const sutAsNonOwner = await ethers.getContract<W3Shop>(
        'W3Shop',
        nonOwner
      );
      await expect(sutAsNonOwner.closeShop(sutAsNonOwner.address)).to.be
        .reverted;
    });

    it('closes the shop and transfers the funds when called from an owner', async function () {
      const { shopOwner } = await getNamedAccounts();
      const cashReceiver = (await ethers.getSigners())[1];
      const sutAsOwner = await ethers.getContract<W3Shop>('W3Shop', shopOwner);

      await expect(
        await sutAsOwner.closeShop(cashReceiver.address)
      ).to.changeEtherBalances(
        [sutAsOwner, cashReceiver],
        [-100000000000, 100000000000]
      );
    });

    it('burns the owner NFT token', async function () {
      const [owner] = await ethers.getSigners();
      expect(await sut.balanceOf(owner.address, 0)).to.equal(0);
    });

    it('keeps all the other sold NFT tokens', async function () {
      const { buyer } = await getNamedAccounts();
      expect(await sut.balanceOf(buyer, 3)).to.equal(5);
    });

    it('reverts buying when shop is closed', async function () {
      const { buyer } = await getNamedAccounts();
      const sutAsBuyer = await ethers.getContract<W3Shop>('W3Shop', buyer);
      const buyTx = buyItem(
        sutAsBuyer,
        [2],
        [BigNumber.from(3)],
        [BigNumber.from(50000000000)]
      );

      await expect(buyTx).to.be.reverted;
    });
  });
});
