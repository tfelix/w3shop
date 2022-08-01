import { expect } from 'chai';
import { BigNumber, ContractReceipt } from 'ethers';
import { parseEther } from 'ethers/lib/utils';
import {
  ethers,
  getNamedAccounts,
} from 'hardhat';
import { W3Shop2, W3ShopFactory2, W3ShopItems } from '../typechain';
import { makeMerkleRoot } from './proof-helper';

const arweaveId1 = 'ar://AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const arweaveId2 = 'ar://BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB';

const shopConfig = 'ar://shopConfig000000000000000000000000000000000';
const ownerNftId = 'ar://ownerNftId000000000000000000000000000000000';

const itemIdsNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const itemPricesNumbers = [
  12000000000, 30000000000, 50000000000, 1005600000, 100078200000, 10000000000,
  10000000000, 10000000000, 30000000000, 45600000000,
];
const itemIds = itemIdsNumbers.map((id) => BigNumber.from(id));
const itemPrices = itemPricesNumbers.map((prices) => BigNumber.from(prices));
const validItemsRoot = makeMerkleRoot(itemIds, itemPrices);

describe('W3Shop2', async function () {
  // We define a fixture to reuse the same setup in every test. We use
  // loadFixture to run this setup once, snapshot that state, and reset Hardhat
  // Network to that snapshopt in every test.
  async function deployShopFixture() {
    const W3ShopFactory2 = await ethers.getContractFactory('W3ShopFactory2');
    const factory = (await W3ShopFactory2.deploy()) as W3ShopFactory2;
    await factory.deployed();

    const shopItemsAddr = await factory.shopItems();

    const [owner, addr1, addr2] = await ethers.getSigners();

    const shopItems = await ethers.getContractAt('W3ShopItems', shopItemsAddr) as W3ShopItems;

    const tx = await factory.createShop(
      owner.address,
      shopConfig,
      ownerNftId,
      ethers.utils.formatBytes32String('5555')
    );
    const receipt: ContractReceipt = await tx.wait();

    const event = receipt.events?.find((x) => x.event === 'Created')!;
    const eventArgs = event.args!;

    const sut = await ethers.getContractAt('W3Shop2', eventArgs.shop) as W3Shop2;

    // Fixtures can return anything you consider useful for your tests
    return { sut, shopItems, owner, addr1, addr2 };
  }

  describe('#constructor', async () => {
    it('mints the special owner NFT', async () => {
      const { sut, shopItems, owner } = await deployShopFixture();

      const nftId = await sut.ownerTokenId();
      expect(await shopItems.balanceOf(owner.address, nftId)).to.equal(1);
    });

    it('sets the correct NFT URI in item registry', async () => {
      const { sut, shopItems } = await deployShopFixture();
      const nftId = await sut.ownerTokenId();
      expect(await shopItems.uri(nftId)).to.equal(ownerNftId);
    });

    it('sets the correct shop config', async () => {
      const { sut } = await deployShopFixture();
      expect(await sut.shopConfig()).to.equal(shopConfig);
    });
  });

  describe('#mintOwnerNft', async () => {
    it('reverts after initial call from factory', async () => {
      const { sut, owner } = await deployShopFixture();

      await expect(
        sut.mintOwnerNft(owner.address, arweaveId1)
      ).to.be.reverted;
    });
  });

  describe('#prepareItems', async () => {
    it('returns the newly registered item ids', async () => {
      const { sut, owner } = await deployShopFixture();

      const tx = await sut.connect(owner).prepareItems([arweaveId1, arweaveId2]);
      const reciept = await tx.wait();

      // How to find them?
      // console.log(reciept);
    });

    it('reverts when shop is closed', async () => {
      const { sut, owner } = await deployShopFixture();
      await sut.connect(owner).closeShop(owner.address);

      await expect(
        sut.connect(owner).prepareItems([arweaveId1, arweaveId2])
      ).to.be.revertedWith("shop closed");
    });

    it('reverts when it is not shop owner', async () => {
      const { sut, addr1 } = await deployShopFixture();

      await expect(
        sut.connect(addr1).prepareItems([arweaveId1, arweaveId2])
      ).to.be.revertedWith("not owner");
    });
  });

  describe('#setShopConfig', async () => {
    it('sets a new shop config', async () => {
      const { sut } = await deployShopFixture();
      const tx = await sut.setShopConfig(arweaveId1);
      await tx.wait();

      expect(await sut.shopConfig()).to.equal(arweaveId1);
    });

    it('reverts when shop is closed', async () => {
      const { sut, owner } = await deployShopFixture();
      await sut.connect(owner).closeShop(owner.address);

      await expect(
        sut.connect(owner).setShopConfig(arweaveId1)
      ).to.be.revertedWith("shop closed");
    });

    it('reverts when it is not shop owner', async () => {
      const { sut, addr1 } = await deployShopFixture();

      await expect(
        sut.connect(addr1).setShopConfig(arweaveId1)
      ).to.be.revertedWith("not owner");
    });
  });

  describe('#setItemsRoot', async () => {
    it('sets a new items root', async () => {
      const { sut } = await deployShopFixture();
      const tx = await sut.setItemsRoot(validItemsRoot);
      await tx.wait();

      expect(await sut.itemsRoot()).to.equal(validItemsRoot);
    });

    it('reverts when shop is closed', async () => {
      const { sut, owner } = await deployShopFixture();
      await sut.closeShop(owner.address);

      await expect(
        sut.setItemsRoot(validItemsRoot)
      ).to.be.revertedWith("shop closed");
    });

    it('reverts when it is not shop owner', async () => {
      const { sut, addr1 } = await deployShopFixture();

      await expect(
        sut.connect(addr1).setItemsRoot(validItemsRoot)
      ).to.be.revertedWith("not owner");
    });
  });

  describe('#buy', async () => {

  });

  describe('#cashout', async () => {

  });

  describe('#closeShop', async () => {
    it('reverts when it is not shop owner', async () => {
      const { sut, addr1 } = await deployShopFixture();

      await expect(
        sut.connect(addr1).closeShop(addr1.address)
      ).to.be.revertedWith("not owner");
    });

    it('reverts when shop is closed', async () => {
      const { sut, owner } = await deployShopFixture();

      await sut.closeShop(owner.address);

      await expect(
        sut.closeShop(owner.address)
      ).to.be.revertedWith("shop closed");
    });

    it('performs a cashout of funds', async () => {
      const { sut, owner } = await deployShopFixture();

      await owner.sendTransaction({ to: sut.address, value: parseEther('1') });
      expect(await ethers.provider.getBalance(sut.address)).to.eq(parseEther('1'));

      await sut.closeShop(owner.address);

      expect(await ethers.provider.getBalance(sut.address)).to.eq(parseEther('0'));
    });
  });

  describe('#setAcceptedCurrency', async () => {

  });
});
