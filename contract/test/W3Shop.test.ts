import { expect } from 'chai';
import {
  deployments,
  ethers,
  getNamedAccounts,
  getUnnamedAccounts,
} from 'hardhat';
import { W3Shop } from '../typechain';
import { makeMerkleProof, makeMerkleRoot } from './proof-helper';

const itemIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const itemPrices = [
  12000000000, 30000000000, 50000000000, 1005600000, 100078200000, 10000000000,
  10000000000, 10000000000, 30000000000, 45600000000,
];
const arweaveId1 = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const arweaveId2 = 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB';
const validItemsRoot = makeMerkleRoot(itemIds, itemPrices);

async function buyItem(
  amounts: number[],
  proofItemsIds: number[],
  proofItemPrices: number[]
) {
  const { buyer } = await getNamedAccounts();
  const { proof, proofFlags } = makeMerkleProof(
    itemIds,
    itemPrices,
    proofItemsIds,
    proofItemPrices
  );

  let totalPrice = 0;
  for (let i = 0; i < proofItemPrices.length; i++) {
    totalPrice += proofItemPrices[i] * amounts[i];
  }

  const sutAsBuyer = await ethers.getContract('W3Shop', buyer);

  return sutAsBuyer.buy(
    [2],
    proofItemPrices,
    proofItemsIds,
    proof,
    proofFlags,
    {
      value: totalPrice,
    }
  );
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

  it('Returns a proper config uri', async function () {
    expect(await sut.getShopConfig()).to.equal(
      'https://arweave.net/' + arweaveId1
    );
  });

  it('Returns a proper URI for the owner NFT', async function () {
    expect(await sut.uri(0)).to.equal(
      'https://arweave.net/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB'
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
      expect(await sutAsOwner.uri(1)).to.equal(
        'https://arweave.net/' + arweaveId1
      );
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
  });

  describe('When setting the shopData as a non shop owner', async function () {
    it('reverts as non-owner', async function () {
      const { buyer } = await getNamedAccounts();
      const sutAsBuyer = await ethers.getContract('W3Shop', buyer);
      await expect(
        sutAsBuyer.setShopData(arweaveId2, validItemsRoot)
      ).to.be.revertedWith('not owner');
    });

    it('works as owner', async function () {
      const { shopOwner } = await getNamedAccounts();
      const sutAsOwner = await ethers.getContract('W3Shop', shopOwner);

      await sutAsOwner.setShopData(arweaveId2, validItemsRoot);

      expect(await sutAsOwner.itemsRoot()).to.equal(validItemsRoot);
    });

    describe('Buying an item', async function () {
      const { buyer } = await getNamedAccounts();
      const proofItemsIds = [3];
      const proofItemPrices = [50000000000];
      const { proof, proofFlags } = makeMerkleProof(
        itemIds,
        itemPrices,
        proofItemsIds,
        proofItemPrices
      );

      it('works when proof and payment is correct', async function () {
        await expect(
          await buyItem([2], proofItemsIds, proofItemPrices)
        ).to.changeEtherBalance(sut.address, 50000000000 * 2);

        expect(await sut.balanceOf(buyer, 3)).to.equal(2);
        // TODO Check the resulting item URIs of the tokens.
      });

      it('reverts when payed correctly but proof is false', async function () {
        const tx = sut
          .connect(buyer)
          // We call with different item ID
          .buy([2], proofItemPrices, [2], proof, proofFlags, {
            value: 50000000000 * 2,
          });

        await expect(tx).to.be.reverted;
      });

      it('reverts when payed incorrectly', async function () {
        const tx = sut
          .connect(buyer)
          .buy([2], proofItemPrices, proofItemsIds, proof, proofFlags, {
            value: 48000000000 * 2,
          });
        await expect(tx).to.be.reverted;
      });
    });

    describe('When cashout is called', async function () {
      it('reverts when from a non owner', async function () {
        const nonOwner = (await getUnnamedAccounts())[0];
        const sutAsNonOwner = await ethers.getContract('W3Shop', nonOwner);
        const tx = sutAsNonOwner.cashout(nonOwner);
        await expect(tx).to.be.reverted;
      });

      // Currently broken
      xit('when called from owner sends the all funds', async function () {
        const { shopOwner } = await getNamedAccounts();
        const cashReceiver = (await ethers.getSigners())[1];
        const sutAsOwner = await ethers.getContract('W3Shop', shopOwner);

        await expect(
          await sutAsOwner.cashout(cashReceiver.address)
        ).to.changeEtherBalances(
          [sut, cashReceiver],
          [-100000000000, 100000000000]
        );
      });
    });

    describe('When closeShop is called', async function () {


      it('reverts from non owner', async function () {
        const nonOwner = (await getUnnamedAccounts())[0];
        const sutAsNonOwner = await ethers.getContract('W3Shop', nonOwner);
        await expect(
          sutAsNonOwner.closeShop(sutAsNonOwner.address)
        ).to.be.revertedWith('not owner');
      });

      // TODO These tests are currently broken
      /*
      const { buyer } = await getNamedAccounts();
      xdescribe('When called from a owner', async function () {
        const { shopOwner } = await getNamedAccounts();
        const sutAsOwner = await ethers.getContract('W3Shop', shopOwner);
        const cashReceiver = (await ethers.getSigners())[1];

        this.beforeEach(async function () {
          await sutAsOwner.closeShop(cashReceiver);
        });

        it('closes the shop and transfers the funds', async function () {
          const { shopOwner } = await getNamedAccounts();
          const cashReceiver = (await ethers.getSigners())[1];
          const sutAsOwner = await ethers.getContract('W3Shop', shopOwner);
          await buyItem([2], [3], [50000000000]);

          await expect(
            await sutAsOwner.closeShop(cashReceiver)
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
          expect(await sut.balanceOf(buyer, 3)).to.equal(2);
        });

        it('reverts buying when shop is closed', async function () {
          const buyTx = buyItem([2], [3], [50000000000]);

          await expect(buyTx).to.be.reverted;
        });
      });*/
    });
  });
});
