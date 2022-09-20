import { BigNumber, ContractReceipt } from 'ethers';
import { ethers } from 'hardhat';
import {
  W3Shop, W3ShopFactory, W3PaymentProcessor, W3ShopItems,
  MerkleMultiProof, MockToken
} from '../typechain';
import { makeMerkleRoot } from './proof-helper';

const arweaveId1 = 'ar://AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

const shopConfig = 'ar://shopConfig000000000000000000000000000000000';
const ownerNftId = 'ar://ownerNftId000000000000000000000000000000000';

const itemPricesNumbers = [
  12000000000, 30000000000, 50000000000, 1005600000, 100078200000, 10000000000,
  10000000000, 10000000000, 30000000000, 45600000000,
];
const itemPrices = itemPricesNumbers.map((prices) => BigNumber.from(prices));

// We define a fixture to reuse the same setup in every test. We use
// loadFixture to run this setup once, snapshot that state, and reset Hardhat
// Network to that snapshopt in every test.
export async function deployShopFixture() {
  const MockToken = await ethers.getContractFactory('MockToken');
  const mockToken = (await MockToken.deploy()) as MockToken;
  await mockToken.deployed();

  const W3ShopFactory = await ethers.getContractFactory('W3ShopFactory');
  const factory = (await W3ShopFactory.deploy()) as W3ShopFactory;
  await factory.deployed();

  const MerkleMultiProof = await ethers.getContractFactory('MerkleMultiProof');
  const merkleProof = (await MerkleMultiProof.deploy()) as MerkleMultiProof;
  await merkleProof.deployed();

  const PaymentProcessor = await ethers.getContractFactory('W3PaymentProcessor', {
    libraries: {
      MerkleMultiProof: merkleProof.address,
    },
  });
  const paymentProcessor = (await PaymentProcessor.deploy()) as W3PaymentProcessor;
  await paymentProcessor.deployed();

  const shopItemsAddr = await factory.shopItems();

  const [owner, addr1, addr2] = await ethers.getSigners();

  const shopItems = await ethers.getContractAt('W3ShopItems', shopItemsAddr) as W3ShopItems;

  const tx = await factory.createShop(
    owner.address,
    paymentProcessor.address,
    shopConfig,
    ownerNftId,
    ethers.utils.formatBytes32String('5555')
  );
  const receipt: ContractReceipt = await tx.wait();

  const eventCreated = receipt.events?.find((x) => x.event === 'Created')!;
  const eventCreatedArgs = eventCreated.args!;

  const shop = await ethers.getContractAt('W3Shop', eventCreatedArgs.shop) as W3Shop;

  // Create three items for the tests
  const itemUris = [0, 1, 2].map(_ => arweaveId1);
  const setItemUrisTx = await shop.setItemUris(itemUris);
  const setItemsReceipt = await setItemUrisTx.wait();
  const eventNewItems = setItemsReceipt.events?.find((x) => x.event === 'NewShopItems')!;
  const eventNewItemsArgs = eventNewItems.args!;
  const existingItemIds = eventNewItemsArgs.ids as BigNumber[];

  const validItemsRoot = makeMerkleRoot(existingItemIds, itemPrices);
  const setItemsRootTx = await shop.setItemsRoot(validItemsRoot);
  await setItemsRootTx.wait();

  // Fixtures can return anything you consider useful for your tests
  return { shop, shopItems, owner, paymentProcessor, addr1, addr2, existingItemIds, mockToken, merkleProof };
}