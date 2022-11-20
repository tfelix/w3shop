import { W3ShopFactory } from '../typechain-types';
import { expect } from 'chai';
import { ethers, getNamedAccounts } from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ContractReceipt } from 'ethers';

import { buildExpectedShopAddress } from './shop-addr-helper';

async function deployContractFixture() {
  const W3ShopFactory = await ethers.getContractFactory('W3ShopFactory');
  const sut = (await W3ShopFactory.deploy()) as W3ShopFactory;
  const shopItemsAddress = await sut.shopItems();

  return { sut, shopItemsAddress };
}

describe('W3ShopFactory', function () {
  const shopConfig = 'ar:AAAAAAAAAAAAAAAAAA';
  const ownerNftId = 'ar:BBBBBBBBBBBBBBBBBB';
  const paymentProcessorAddr = '0xb5f4af1a4B5021Ae10207E1C2E119ce8249B3007';
  const salt = "0x7c5ea36004851c764c44143b1dcb59679b11c9a68e5f41497f6cf3d480715331";

  describe('#createShop', async function () {
    it('emits an event with owner and shop addr', async () => {
      const { sut, shopItemsAddress } = await loadFixture(deployContractFixture);
      const { shopOwner } = await getNamedAccounts();
      const computedAddr = await buildExpectedShopAddress(
        sut.address,
        shopOwner,
        paymentProcessorAddr,
        shopItemsAddress,
        salt
      );

      const tx = await sut.createShop(
        shopOwner,
        paymentProcessorAddr,
        shopConfig,
        ownerNftId,
        salt
      );

      const receipt: ContractReceipt = await tx.wait();
      const event = receipt.events?.find((x) => x.event === 'Created')!;
      const eventArgs = event.args!;

      expect(eventArgs.owner).to.equal(shopOwner);
      expect(eventArgs.shop.toUpperCase()).to.equal(computedAddr.toUpperCase());
    });
  });

  describe('#isRegisteredShop', async function () {
    it('returns true for a created shop', async function () {
      const newSalt = "0x8a5ea36004851c764c44143b1dcb59679b11c9a68e5f41497f6cf3d480715331";
      const { sut } = await loadFixture(deployContractFixture);
      const { shopOwner } = await getNamedAccounts();

      const tx = await sut.createShop(
        shopOwner,
        paymentProcessorAddr,
        shopConfig,
        ownerNftId,
        newSalt
      );

      const receipt: ContractReceipt = await tx.wait();
      const event = receipt.events?.find((x) => x.event === 'Created')!;
      const eventArgs = event.args!;

      expect(await sut.isRegisteredShop(eventArgs.shop)).to.be.true;
    });

    it('returns false for a random address', async function () {
      const { sut } = await loadFixture(deployContractFixture);
      expect(await sut.isRegisteredShop('0x00192Fb10dF37c9FB26829eb2CC623cd1BF599E8')).to.be.false;
    });
  });
});
