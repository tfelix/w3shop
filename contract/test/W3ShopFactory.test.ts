import { W3ShopFactory } from '../typechain';
import { expect } from 'chai';
import { ethers, deployments, getNamedAccounts } from 'hardhat';
import { Deployment } from 'hardhat-deploy/dist/types';
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
  shopOwnerAddr: string,
  w3ShopBytecode: string,
  salt: string,
  shopManifestParam: string,
  shopConfigParam: string
): string {
  // Calculate addresse before and compare later.
  const constructorTypes = ['address', 'string', 'string'];
  const constructorArgs = [shopOwnerAddr, shopManifestParam, shopConfigParam];

  // constructor arguments are appended to contract bytecode
  const bytecode = `${w3ShopBytecode}${encodeParam(
    constructorTypes,
    constructorArgs
  ).slice(2)}`;

  return buildCreate2Address(factoryAddress, salt, bytecode);
}

describe('W3ShopFactory', function () {
  let sut: W3ShopFactory;
  let w3ShopDeployment: Deployment;

  this.beforeAll(async function () {
    w3ShopDeployment = (await deployments.fixture(['W3ShopFactory', 'W3Shop']))
      .W3Shop;
    sut = await ethers.getContract('W3ShopFactory');
  });

  describe('When createShop is called', async function () {
    it('creates deterministic addresses', async function () {
      const { shopOwner } = await getNamedAccounts();
      const salt = '1234';
      const shopManifest = 'ar:ABCDEFG';
      const shopConfig = 'ar:ABCDEFG';

      const factoryAddress = sut.address;
      const computedAddr = buildExpectedShopAddress(
        factoryAddress,
        shopOwner,
        w3ShopDeployment.bytecode!,
        salt,
        shopManifest,
        shopConfig
      );

      const shop = await sut.callStatic.createShop(
        shopOwner,
        shopManifest,
        shopConfig,
        ethers.utils.formatBytes32String(salt)
      );

      expect(shop.toLowerCase()).to.equal(computedAddr);
    });

    it('emits an event with owner and shop addr', async function () {
      const { shopOwner } = await getNamedAccounts();
      const salt = '3456';
      const shopManifest = 'ar:ABCDEFG';
      const shopConfig = 'ar:ABCDEFG';

      const factoryAddress = sut.address;
      const computedAddr = buildExpectedShopAddress(
        factoryAddress,
        shopOwner,
        w3ShopDeployment.bytecode!,
        salt,
        shopManifest,
        shopConfig
      );

      const tx = await sut.createShop(
        shopOwner,
        shopManifest,
        shopConfig,
        ethers.utils.formatBytes32String(salt)
      );
      const receipt: ContractReceipt = await tx.wait();
      const event = receipt.events?.find((x) => x.event === 'Created')!;
      const eventArgs = event.args!;

      expect(eventArgs.owner).to.equal(shopOwner);
      expect(eventArgs.shop.toLowerCase()).to.equal(computedAddr);
    });
  });
});
