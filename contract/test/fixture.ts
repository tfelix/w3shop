import { BigNumber, ContractReceipt } from 'ethers';
import { ethers } from 'hardhat';
import {
  W3Shop, W3ShopFactory, W3PaymentProcessorV1,
  MockTokenERC20, MockTokenERC1155
} from '../typechain-types';
import { makeMerkleRoot } from './proof-helper';

export const arweaveUri1 = 'ar://AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
export const shopConfigUri = 'ar://shopConfig000000000000000000000000000000000';
export const ownerMetaUri = 'ar://ownerNftId000000000000000000000000000000000';
export const shopContractUri = 'ar://shopContractUri0000000000000000000000000000';

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

  /*
  const MockTokenERC777= await ethers.getContractFactory('MockTokenERC777');
  const mockTokenERC777 = (await MockTokenERC777.deploy()) as MockTokenERC777;
  await mockTokenERC1155.deployed();
  */

  return {
    mockTokenERC20,
    mockTokenERC1155,
    // mockTokenERC777
  };
}

// We define a fixture to reuse the same setup in every test. We use
// loadFixture to run this setup once, snapshot that state, and reset Hardhat
// Network to that snapshopt in every test.
export async function deployShopFixture() {
  const W3ShopFactory = await ethers.getContractFactory('W3ShopFactory');
  const factory = (await W3ShopFactory.deploy()) as W3ShopFactory;
  await factory.deployed();

  const PaymentProcessor = await ethers.getContractFactory('W3PaymentProcessorV1');
  const paymentProcessor = (await PaymentProcessor.deploy()) as W3PaymentProcessorV1;
  await paymentProcessor.deployed();

  const [owner, addr1, addr2] = await ethers.getSigners();

  const salt = "0x7c5ea36004851c764c44143b1dcb59679b11c9a68e5f41497f6cf3d480715331";

  const tx = await factory.createShop({
    owner: owner.address,
    name: "Test",
    ownerMetaUri: ownerMetaUri,
    shopConfigUri: shopConfigUri,
    shopContractUri: shopContractUri,
    paymentProcessor: paymentProcessor.address,
    paymentReceiver: owner.address
  }, salt);

  // Wait for the deployment
  const receipt: ContractReceipt = await tx.wait();

  // Extract the shop address from the event and turn it into a shop
  const eventCreated = receipt.events?.find((x) => x.event === 'CreatedShop')!;
  const eventCreatedArgs = eventCreated.args!;

  const shop = await ethers.getContractAt('W3Shop', eventCreatedArgs.shop) as W3Shop;

  // Create three items for the tests
  const itemUris = [0, 1, 2].map(_ => arweaveUri1);
  const nextItemId = await shop.getNextItemId();

  await shop.prepareItems(itemUris, [0, 0, 0]);

  // Three items were created
  const existingItemIds = [0, 1, 2].map(x => nextItemId.add(x));

  // Generate new merkle root for the created items and set it
  const validItemsRoot = makeMerkleRoot(existingItemIds, existingItemPrices);
  const setItemsRootTx = await shop.setItemsRoot(validItemsRoot);
  await setItemsRootTx.wait();

  // Fixtures can return anything you consider useful for your tests
  return {
    shop,
    owner,
    paymentProcessor,
    addr1,
    addr2,
    existingItemIds,
    existingItemPrices,
  };
}