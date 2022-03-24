import { expect } from 'chai';
import { ethers } from 'hardhat';
// eslint-disable-next-line node/no-missing-import
import { W3ShopFactory } from '../typechain';

async function deployContract(): Promise<W3ShopFactory> {
  const W3ShopFactory = await ethers.getContractFactory('W3ShopFactory');
  const sut = await W3ShopFactory.deploy();
  await sut.deployed();

  return sut as W3ShopFactory;
}

describe('W3ShopFactory', function () {
  it('creates new shop contracts', async function () {
    const sut = await deployContract();

    await expect(sut.createShop()).to.emit(sut, 'Created');
  });
});
