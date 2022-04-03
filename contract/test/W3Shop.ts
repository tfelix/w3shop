import { expect } from 'chai';
import { deployments, ethers, getNamedAccounts } from 'hardhat';
import { W3Shop } from '../typechain';

const itemIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const itemPrices = [
  12000000000, 30000000000, 51200000000, 1005600000, 100078200000,
  10000000000, 10000000000, 10000000000, 30000000000, 45600000000,
];

describe('W3Shop', function () {
  let merkleProofContractAddr: string;
  let sut: W3Shop;

  this.beforeAll(async function () {
    await deployments.fixture(['W3Shop']);
    sut = await ethers.getContract('W3Shop');
  });

  it('Mints a special owner NFT when deplyoed', async function () {
    const { shopOwner } = await getNamedAccounts();
    expect(await sut.balanceOf(shopOwner, 0)).to.equal(1);
  });

  describe('When setting offerRoot', function () {
    let sut: W3Shop;
    let validOfferRoot: string;

    this.beforeAll(async function () {

    });

    it('reverts as non-owner', async function () {
      const { buyer } = await getNamedAccounts();
      const root = ethers.utils.formatBytes32String('abcdef');
      expect(sut.connect(buyer).setOfferRoot(root)).to.be.revertedWith(
        'not owner'
      );
    });

    it('works as owner', async function () {
      const { shopOwner } = await getNamedAccounts();
      await sut.connect(shopOwner).setOfferRoot(validOfferRoot);

      expect(await sut.offerRoot()).to.equal(validOfferRoot);
    });

    describe('with root set and buying an item', function () {
      it('works when proof and payment is correct', async function () { });
      it('reverts when payed correctly but proof is false', async function () { });
      it('reverts when payed incorrectly', async function () { });

      describe('with money on the contract and cashout called', function () {
        it('reverts when called from a non owner', async function () { });
        it('when called from owner sends the all funds', async function () { });
      });

      describe('close called from a non owner', function () {
        it('reverts', async function () {
          const addr1 = (await ethers.getSigners())[1];
          expect(
            sut.connect(addr1).closeShop(addr1.address)
          ).to.be.revertedWith('not owner');
        });
      });

      describe('close called from a owner', function () {
        this.beforeAll(async function () {
          const { shopOwner } = await getNamedAccounts();
          expect(sut.connect(shopOwner).closeShop(shopOwner));
        });

        it('closes the shop', async function () { });
        it('sends all the funds to the caller of the method', async function () { });
        it('burns the owner NFT token', async function () {
          const [owner] = await ethers.getSigners();
          expect(await sut.balanceOf(owner.address, 0)).to.equal(0);
        });
        it('keeps all the other sold NFT tokens', async function () { });

        it('reverts buying when shop is closed', async function () { });
      });
    });
  });
});
