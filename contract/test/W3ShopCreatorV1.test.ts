import { expect } from 'chai';
import { ethers, getNamedAccounts } from 'hardhat';
import {
  W3ShopCreatorV1, W3Shop, W3ShopFactory
} from '../typechain';

describe('W3ShopCreatorV1', async function () {

  let sut: W3ShopCreatorV1;

  const shopConfig = 'ar://shopConfig000000000000000000000000000000000';
  const ownerNftId = 'ar://ownerNftId000000000000000000000000000000000';
  const paymentProcessorAddr = '0xb5f4af1a4B5021Ae10207E1C2E119ce8249B3007';
  const salt = "0x7c5ea36004851c764c44143b1dcb59679b11c9a68e5f41497f6cf3d480715331";

  this.beforeAll(async () => {
    const W3ShopFactory = await ethers.getContractFactory('W3ShopFactory');
    const factory = (await W3ShopFactory.deploy()) as W3ShopFactory;
    await factory.deployed();

    const shopItemsAddr = await factory.shopItems();

    const W3ShopCreatorV1 = await ethers.getContractFactory('W3ShopCreatorV1');
    sut = (await W3ShopCreatorV1.deploy(factory.address, shopItemsAddr)) as W3ShopCreatorV1;
  });

  describe('#createShop', async () => {
    it('generates the shop with a vault', async () => {
      const { shopOwner } = await getNamedAccounts();

      const shopTx = await sut.createShop(
        shopOwner,
        paymentProcessorAddr,
        shopConfig,
        ownerNftId,
        salt
      );

      const receipt = await shopTx.wait();

      const eventCreated = receipt.events?.find((x) => x.event === 'Created')!;
      const eventCreatedArgs = eventCreated.args!;

      const shop = await ethers.getContractAt('W3Shop', eventCreatedArgs.shop) as W3Shop;

      expect(await shop.getVault()).to.not.be.equal(ethers.constants.AddressZero);
    });
  });
});
