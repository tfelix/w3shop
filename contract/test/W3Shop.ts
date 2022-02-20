import { expect } from 'chai';
import { BytesLike } from 'ethers';
import { ethers } from 'hardhat';
// eslint-disable-next-line node/no-missing-import
import { W3Shop } from '../typechain';

async function deployContract(): Promise<W3Shop> {
  const W3Shop = await ethers.getContractFactory('W3Shop');
  return (await W3Shop.deploy('ipfs://example')) as W3Shop;
}

/*
describe('cashout()', function () {
  it('Reverts on non owner', async function () {
    const [owner, addr1] = await ethers.getSigners();
    const sut = await deployContract();
    expect(sut.connect(addr1).cashout()).to.be.revertedWith('not owner');
  });

  it('Send owner the fund', async function () {
    const [owner, addr1] = await ethers.getSigners();
    const sut = await deployContract();
    sut.connect(addr1).cashout();
  });
}); */

describe('W3Shop', function () {
  it('Mints a special owner NFT when deplyoed', async function () {
    const [owner] = await ethers.getSigners();
    const W3Shop = await ethers.getContractFactory('W3Shop');
    const sut = await W3Shop.deploy('ipfs://example');
    await sut.deployed();
    expect(await sut.balanceOf(owner.address, 0)).to.equal(1);
  });

  describe('Setting a offerRoot', function () {
    let sut: W3Shop;
    let validOfferRoot: BytesLike;

    this.beforeAll(async function () {
      sut = await deployContract();

      // Calculate proper root with 10 possible items.
      validOfferRoot = ethers.utils.formatBytes32String('HelloWorld');
    });

    describe('as non-owner', function () {
      it('reverts', async function () {
        const addr1 = (await ethers.getSigners())[1];
        const root = ethers.utils.formatBytes32String('abcdef');
        expect(sut.connect(addr1).setOfferRoot(root)).to.be.revertedWith(
          'not owner'
        );
      });
    });

    describe('as owner', function () {
      it('works', async function () {
        const [owner] = await ethers.getSigners();
        await sut.connect(owner).setOfferRoot(validOfferRoot);

        expect(await sut.offerRoot()).to.equal(validOfferRoot);
      });
    });

    describe('buying an item included in the offers', function () {
      it('works when payed correctly', async function () { });
      it('reverts when payed incorrectly', async function () { });
    });
  });
});
