import { BigNumber, ContractReceipt } from 'ethers';
import { ethers } from 'hardhat';
import {
  W3Shop, W3ShopFactory, W3PaymentProcessorV1, W3ShopItems,
  MerkleMultiProof, MockTokenERC20, MockTokenERC1155, W3ShopVaultV1
} from '../typechain';
import { makeMerkleRoot } from '../test/proof-helper';

const arweaveId1 = 'ar://AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

const shopConfig = 'ar://shopConfig000000000000000000000000000000000';
const ownerNftId = 'ar://ownerNftId000000000000000000000000000000000';

const itemPricesNumbers = [
  12000000000, 30000000000, 50000000000
];

const existingItemPrices = itemPricesNumbers.map((prices) => BigNumber.from(prices));

export async function deployMockTokens() {
  const MockTokenERC20 = await ethers.getContractFactory('MockTokenERC20');
  const mockTokenERC20 = (await MockTokenERC20.deploy()) as MockTokenERC20;
  await mockTokenERC20.deployed();

  const MockTokenERC1155 = await ethers.getContractFactory('MockTokenERC1155');
  const mockTokenERC1155 = (await MockTokenERC1155.deploy()) as MockTokenERC1155;
  await mockTokenERC1155.deployed();

  return {
    mockTokenERC20,
    mockTokenERC1155
  };
}

// We define a fixture to reuse the same setup in every test. We use
// loadFixture to run this setup once, snapshot that state, and reset Hardhat
// Network to that snapshopt in every test.
export async function deployShopFixture() {
  const W3ShopFactory = await ethers.getContractFactory('W3ShopFactory');
  const factory = (await W3ShopFactory.deploy()) as W3ShopFactory;
  await factory.deployed();

  const MerkleMultiProof = await ethers.getContractFactory('MerkleMultiProof');
  const merkleProof = (await MerkleMultiProof.deploy()) as MerkleMultiProof;
  await merkleProof.deployed();

  const PaymentProcessor = await ethers.getContractFactory('W3PaymentProcessorV1', {
    libraries: {
      MerkleMultiProof: merkleProof.address,
    },
  });
  const paymentProcessor = (await PaymentProcessor.deploy()) as W3PaymentProcessorV1;
  await paymentProcessor.deployed();

  const shopItemsAddr = await factory.shopItems();

  const [owner, addr1, addr2] = await ethers.getSigners();

  const shopItems = await ethers.getContractAt('W3ShopItems', shopItemsAddr) as W3ShopItems;

  const salt = "0x7c5ea36004851c764c44143b1dcb59679b11c9a68e5f41497f6cf3d480715331";

  const tx = await factory.createShop(
    owner.address,
    paymentProcessor.address,
    shopConfig,
    ownerNftId,
    salt
  );
  const receipt: ContractReceipt = await tx.wait();

  const eventCreated = receipt.events?.find((x) => x.event === 'Created')!;
  const eventCreatedArgs = eventCreated.args!;

  const shop = await ethers.getContractAt('W3Shop', eventCreatedArgs.shop) as W3Shop;

  const W3ShopVaultV1 = await ethers.getContractFactory('W3ShopVaultV1');
  const vault = (await W3ShopVaultV1.deploy(shop.address)) as W3ShopVaultV1;
  await vault.deployed();

  // Create three items for the tests
  const itemUris = [0, 1, 2].map(_ => arweaveId1);
  const setItemUrisTx = await shop.setItemUris(itemUris, [0, 0, 0]);
  const setItemsReceipt = await setItemUrisTx.wait();
  const eventNewItems = setItemsReceipt.events?.find((x) => x.event === 'NewShopItems')!;
  const eventNewItemsArgs = eventNewItems.args!;
  const existingItemIds = eventNewItemsArgs.ids as BigNumber[];

  const validItemsRoot = makeMerkleRoot(existingItemIds, existingItemPrices);
  const setItemsRootTx = await shop.setItemsRoot(validItemsRoot);
  await setItemsRootTx.wait();

  // Fixtures can return anything you consider useful for your tests
  return {
    shop,
    shopItems,
    owner,
    paymentProcessor,
    addr1,
    addr2,
    existingItemIds,
    existingItemPrices,
    merkleProof,
    vault
  };
}