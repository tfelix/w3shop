import { W3ShopFactory } from '../typechain';
import { expect } from 'chai';
import { ethers, getNamedAccounts } from 'hardhat';
import { ContractReceipt } from 'ethers';
import { buildExpectedShopAddress } from './shop-addr-helper';

function encode(types: string[], values: any[]) {
  const abiCoder = ethers.utils.defaultAbiCoder;
  const encodedParams = abiCoder.encode(types, values);
  return encodedParams.slice(2);
}

describe('W3ShopFactory', function () {
  let sut: W3ShopFactory;
  let shopItemsAddress: string;

  const shopConfig = 'ar:AAAAAAAAAAAAAAAAAA';
  const ownerNftId = 'ar:BBBBBBBBBBBBBBBBBB';
  const paymentProcessorAddr = '0xb5f4af1a4B5021Ae10207E1C2E119ce8249B3007';

  this.beforeAll(async () => {
    const W3ShopFactory = await ethers.getContractFactory('W3ShopFactory');
    sut = (await W3ShopFactory.deploy()) as W3ShopFactory;
    shopItemsAddress = await sut.shopItems();
  });

  describe('#createShop', async function () {
    it('emits an event with owner and shop addr', async () => {
      const { shopOwner } = await getNamedAccounts();
      // Should also work
      // const saltHex = ethers.utils.id("1234");
      const newSalt = "0x7c5ea36004851c764c44143b1dcb59679b11c9a68e5f41497f6cf3d480715331";

      const W3Shop = await ethers.getContractFactory('W3Shop');
      const bytecode = W3Shop.bytecode;

      const initCode = bytecode + encode(
        [
          "address",
          "address",
          "string"
      ],
        [
          paymentProcessorAddr,
          shopItemsAddress,
          shopConfig
        ]
      );
      const initCodeHash = ethers.utils.keccak256(initCode);

      const computedAddr = ethers.utils.getCreate2Address(
        sut.address,
        newSalt,
        initCodeHash
      );

      const tx = await sut.createShop(
        shopOwner,
        paymentProcessorAddr,
        computedAddr,
        shopConfig,
        ownerNftId,
        newSalt
      );

      const receipt: ContractReceipt = await tx.wait();
      const event = receipt.events?.find((x) => x.event === 'Created')!;
      const eventArgs = event.args!;

      expect(eventArgs.owner).to.equal(shopOwner);
      expect(eventArgs.shop.toUpperCase()).to.equal(computedAddr.toUpperCase());
    });

    it('reverts when pre-calc shop addr is different than shop', async () => {
      const { shopOwner } = await getNamedAccounts();
      const salt = '7890';

      const notMatchingAddr = '0x473780deAF4a2Ac070BBbA936B0cdefe7F267dFc';

      expect(sut.createShop(
        shopOwner,
        paymentProcessorAddr,
        notMatchingAddr,
        shopConfig,
        ownerNftId,
        ethers.utils.formatBytes32String(salt)
      )).to.be.reverted;
    });
  });

  describe('#isRegisteredShop', async function () {
    it('returns true for a created shop', async function () {
      const { shopOwner } = await getNamedAccounts();
      const salt = '1234';

      const computedAddr = await buildExpectedShopAddress(
        sut.address,
        paymentProcessorAddr,
        shopItemsAddress,
        shopConfig,
        salt
      );

      const tx = await sut.createShop(
        shopOwner,
        paymentProcessorAddr,
        computedAddr,
        shopConfig,
        ownerNftId,
        ethers.utils.formatBytes32String(salt)
      );
      const receipt: ContractReceipt = await tx.wait();
      const event = receipt.events?.find((x) => x.event === 'Created')!;
      const eventArgs = event.args!;

      expect(await sut.isRegisteredShop(eventArgs.shop)).to.be.true;
    });

    it('returns false for a random address', async function () {
      expect(await sut.isRegisteredShop('0x00192Fb10dF37c9FB26829eb2CC623cd1BF599E8')).to.be.false;
    });
  });
});
