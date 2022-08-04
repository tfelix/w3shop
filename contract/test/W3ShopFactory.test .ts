import { W3ShopFactory } from '../typechain';
import { expect } from 'chai';
import { ethers, getNamedAccounts } from 'hardhat';
import { ContractReceipt } from 'ethers';

// deterministically computes the smart contract address given
// the account the will deploy the contract (factory contract)
// the salt as uint256 and the contract bytecode
function buildCreate2Address(
  creatorAddress: string,
  salt: string,
  byteCode: string
) {
  const tempStr = [
    'ff',
    creatorAddress,
    ethers.utils.formatBytes32String(salt),
    ethers.utils.keccak256(byteCode),
  ]
    .map((x) => x.replace(/0x/, ''))
    .join('');

  return `0x${ethers.utils.keccak256(`0x${tempStr}`).slice(-40)}`.toLowerCase();
}

// encodes parameter to pass as contract argument
function encodeParam(types: string[], data: any[]) {
  return ethers.utils.defaultAbiCoder.encode(types, data);
}

function buildExpectedShopAddress(
  factoryAddress: string,
  paymentProcessorAddress: string,
  shopItemsAddress: string,
  shopConfigParam: string,
  w3ShopBytecode: string,
  salt: string
): string {
  // Calculate addresse before and compare later.
  const constructorTypes = ['address', 'address', 'string'];
  const constructorArgs = [paymentProcessorAddress, shopItemsAddress, shopConfigParam];

  // constructor arguments are appended to contract bytecode
  const bytecode = `${w3ShopBytecode}${encodeParam(
    constructorTypes,
    constructorArgs
  ).slice(2)}`;

  // Fix the casings
  return buildCreate2Address(
    factoryAddress,
    salt,
    bytecode
  ).toUpperCase();
}

describe('W3ShopFactory', function () {
  let sut: W3ShopFactory;
  let w3ShopBytecode: string;
  let shopItemsAddress: string;

  const shopConfig = 'ar:AAAAAAAAAAAAAAAAAA';
  const ownerNftId = 'ar:BBBBBBBBBBBBBBBBBB';
  const paymentProcessorAddr = '0xb5f4af1a4B5021Ae10207E1C2E119ce8249B3007';

  this.beforeAll(async () => {
    const W3Shop = await ethers.getContractFactory('W3Shop');
    w3ShopBytecode = W3Shop.bytecode;
    const W3ShopFactory = await ethers.getContractFactory('W3ShopFactory');
    sut = (await W3ShopFactory.deploy()) as W3ShopFactory;
    shopItemsAddress = await sut.shopItems();
  });

  describe('#createShop', async function () {
    it('emits an event with owner and shop addr', async function () {
      const { shopOwner } = await getNamedAccounts();
      const salt = '3456';

      const computedAddr = buildExpectedShopAddress(
        sut.address,
        paymentProcessorAddr,
        shopItemsAddress,
        shopConfig,
        w3ShopBytecode,
        salt
      );

      const tx = await sut.createShop(
        shopOwner,
        paymentProcessorAddr,
        shopConfig,
        ownerNftId,
        ethers.utils.formatBytes32String(salt)
      );
      const receipt: ContractReceipt = await tx.wait();
      const event = receipt.events?.find((x) => x.event === 'Created')!;
      const eventArgs = event.args!;

      expect(eventArgs.owner).to.equal(shopOwner);
      expect(eventArgs.shop.toUpperCase()).to.equal(computedAddr);
    });
  });

  describe('#isRegisteredShop', async function () {
    it('returns true for a created shop', async function () {
      const { shopOwner } = await getNamedAccounts();
      const salt = '1234';

      const tx = await sut.createShop(
        shopOwner,
        paymentProcessorAddr,
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
