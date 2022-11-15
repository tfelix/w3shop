import { expect } from 'chai';
import { ethers, getNamedAccounts } from 'hardhat';
import {
  W3ShopCreatorV1, W3Shop
} from '../typechain';

describe('W3ShopCreatorV1', async function () {

  let sut: W3ShopCreatorV1;

  const shopConfig = 'ar://shopConfig000000000000000000000000000000000';
  const ownerNftId = 'ar://ownerNftId000000000000000000000000000000000';
  const paymentProcessorAddr = '0xb5f4af1a4B5021Ae10207E1C2E119ce8249B3007';
  const salt = "0x7c5ea36004851c764c44143b1dcb59679b11c9a68e5f41497f6cf3d480715331";

  this.beforeAll(async () => {
    const W3ShopFactory = await ethers.getContractFactory('W3ShopCreatorV1');
    sut = (await W3ShopFactory.deploy()) as W3ShopCreatorV1;
  });

  describe('#createShop', async () => {
    it('generates the shop with a vault', async () => {
      const { owner } = await getNamedAccounts();

      const shop = await sut.createShop(
        owner,
        paymentProcessorAddr,
        shopConfig,
        ownerNftId,
        salt
      ) as W3Shop;

      expect(await shop.getVault()).to.not.equal("0x0");
    });
  });
});
