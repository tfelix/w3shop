import { expect } from 'chai';
import { ethers } from 'hardhat';
import { W3Shop } from '../typechain';

async function deployContract(): Promise<W3Shop> {
  const W3Shop = await ethers.getContractFactory('W3Shop');
  const sut = await W3Shop.deploy('ipfs://example');
  await sut.deployed();

  return sut;
}

describe('W3Shop', function () {
  it('Mints a special owner NFT when deplyoed', async function () {
    const [owner] = await ethers.getSigners();
    const W3Shop = await ethers.getContractFactory('W3Shop');
    const sut = await W3Shop.deploy('ipfs://example');
    await sut.deployed();
    expect(await sut.balanceOf(owner.address, 0)).to.equal(1);
  });

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
  });
});

