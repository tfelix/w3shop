import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { deployMockContract } from 'ethereum-waffle';
import { BigNumber } from 'ethers';
import { parseEther } from 'ethers/lib/utils';
import { ethers } from 'hardhat';
import {
  W3Shop, W3ShopItems
} from '../typechain';
import { deployMockTokens, deployShopFixture } from './fixture';
import { makeMerkleRoot } from './proof-helper';

const arweaveId1 = 'ar://AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

const shopConfig = 'ar://shopConfig000000000000000000000000000000000';
const ownerNftId = 'ar://ownerNftId000000000000000000000000000000000';

const itemPricesNumbers = [12000000000, 30000000000, 50000000000];
const itemPrices = itemPricesNumbers.map((prices) => BigNumber.from(prices));

describe('W3Shop', async function () {

  describe('#constructor', async () => {
    it('mints the special owner NFT', async () => {
      const { shop, shopItems, owner } = await deployShopFixture();

      const nftId = await shop.getOwnerTokenId();
      expect(await shopItems.balanceOf(owner.address, nftId)).to.equal(1);
    });

    it('sets the correct NFT URI in item registry', async () => {
      const { shop, shopItems } = await deployShopFixture();
      const nftId = await shop.getOwnerTokenId();
      expect(await shopItems.uri(nftId)).to.equal(ownerNftId);
    });

    it('sets the correct shop config', async () => {
      const { shop } = await deployShopFixture();
      expect(await shop.getConfig()).to.equal(shopConfig);
    });

    it('has set IDs for the upcoming item registration', async () => {
      const { shop } = await deployShopFixture();
      expect((await shop.getBufferedItemIds())[0]).to.not.equal(0);
      expect((await shop.getBufferedItemIds())[1]).to.not.equal(0);
      expect((await shop.getBufferedItemIds())[2]).to.not.equal(0);
      expect((await shop.getBufferedItemIds())[3]).to.not.equal(0);
    });
  });

  describe('#setTokenRoyalty', async () => {
    it('reverts when not owner', async () => {
      const { shop, addr1, existingItemIds } = await deployShopFixture();

      await expect(
        shop.connect(addr1).setTokenRoyalty(existingItemIds[0], addr1.address, 1000)
      ).to.be.revertedWith("not owner");
    });

    it('sets the royalty', async () => {
      const { shop, owner, existingItemIds } = await deployShopFixture();

      await expect(
        shop.setTokenRoyalty(existingItemIds[0], owner.address, 1000)
      ).to.be.not.reverted;
    });
  });

  describe('#setItemUris', async () => {
    it('reverts when not owner', async () => {
      const { shop, addr1 } = await deployShopFixture();

      await expect(
        shop.connect(addr1).setItemUris([arweaveId1], [0])
      ).to.be.revertedWith("not owner");
    });

    it('reverts when shop is closed', async () => {
      const { shop, owner } = await deployShopFixture();
      await shop.connect(owner).closeShop(owner.address);

      await expect(
        shop.connect(owner).setItemUris([arweaveId1], [0])
      ).to.be.revertedWith("shop closed");
    });

    it('sets item uris for reserved items', async () => {
      const { shop } = await deployShopFixture();
      const prepedId0 = (await shop.getBufferedItemIds())[0];
      const prepedId1 = (await shop.getBufferedItemIds())[1];
      const prepedId2 = (await shop.getBufferedItemIds())[2];

      const reservedIds = [prepedId0, prepedId1, prepedId2];
      const itemUris = [...Array(3)].map(_ => arweaveId1);

      await expect(shop.setItemUris(itemUris, [0, 0, 0]))
        .to.emit(shop, "NewShopItems")
        .withArgs(reservedIds)
    });

    it('re-fills used up slots with new IDs', async () => {
      const { shop } = await deployShopFixture();
      const itemUris = [...Array(5)].map(_ => arweaveId1);
      const itemAmounts = [...Array(5)].map(_ => 0);

      const tx = await shop.setItemUris(itemUris, itemAmounts);
      await tx.wait();

      expect((await shop.getBufferedItemIds())[0]).to.equal(10);
      expect((await shop.getBufferedItemIds())[1]).to.equal(11);
      expect((await shop.getBufferedItemIds())[2]).to.equal(12);
      expect((await shop.getBufferedItemIds())[3]).to.equal(13);
      expect((await shop.getBufferedItemIds())[4]).to.equal(14);
    });

    it('reverts when url count > 5', async () => {
      const { shop } = await deployShopFixture();

      const itemUris = [...Array(6)].map(_ => arweaveId1);
      const itemAmounts = [...Array(6)].map(_ => 0);

      await expect(
        shop.setItemUris(itemUris, itemAmounts)
      ).to.be.revertedWith("invalid uri count");
    });

    it('reverts when url count = 0', async () => {
      const { shop } = await deployShopFixture();

      await expect(
        shop.setItemUris([], [])
      ).to.be.revertedWith("invalid uri count");
    });

    it('sets a limit for the items', async () => {
      const { shop } = await deployShopFixture();
      const prepedId0 = (await shop.getBufferedItemIds())[0];
      const prepedId1 = (await shop.getBufferedItemIds())[1];
      const prepedId2 = (await shop.getBufferedItemIds())[2];

      const reservedIds = [prepedId0, prepedId1, prepedId2];
      const itemUris = [...Array(3)].map(_ => arweaveId1);

      await expect(shop.setItemUris(itemUris, [0, 1, 10]))
        .to.emit(shop, "NewShopItems")
        .withArgs(reservedIds)

      expect(await shop.getMaximumItemCount(prepedId0)).to.eq(ethers.constants.MaxUint256);
      expect(await shop.getMaximumItemCount(prepedId1)).to.eq(1);
      expect(await shop.getMaximumItemCount(prepedId2)).to.eq(10);
    });
  });

  describe('#setConfig', async () => {
    it('sets a new shop config', async () => {
      const { shop } = await deployShopFixture();
      const tx = await shop.setConfig(arweaveId1);
      await tx.wait();

      expect(await shop.getConfig()).to.equal(arweaveId1);
    });

    it('reverts when shop is closed', async () => {
      const { shop, owner } = await deployShopFixture();
      await shop.connect(owner).closeShop(owner.address);

      await expect(
        shop.connect(owner).setConfig(arweaveId1)
      ).to.be.revertedWith("shop closed");
    });

    it('reverts when it is not shop owner', async () => {
      const { shop, addr1 } = await deployShopFixture();

      await expect(
        shop.connect(addr1).setConfig(arweaveId1)
      ).to.be.revertedWith("not owner");
    });
  });

  describe('#setItemsRoot', async () => {
    const itemIds = [10, 20, 30].map((id) => BigNumber.from(id));
    const otherValidItemsRoot = makeMerkleRoot(itemIds, itemPrices);

    it('sets a new items root', async () => {
      const { shop } = await deployShopFixture();
      const tx = await shop.setItemsRoot(otherValidItemsRoot);
      await tx.wait();

      expect(await shop.getItemsRoot()).to.equal(otherValidItemsRoot);
    });

    it('reverts when shop is closed', async () => {
      const { shop, owner } = await deployShopFixture();
      await shop.closeShop(owner.address);

      await expect(
        shop.setItemsRoot(otherValidItemsRoot)
      ).to.be.revertedWith("shop closed");
    });

    it('reverts when it is not shop owner', async () => {
      const { shop, addr1 } = await deployShopFixture();

      await expect(
        shop.connect(addr1).setItemsRoot(otherValidItemsRoot)
      ).to.be.revertedWith("not owner");
    });
  });

  describe('#setConfigRoot', async () => {
    const itemIds = [10, 20, 30].map((id) => BigNumber.from(id));
    const otherValidItemsRoot = makeMerkleRoot(itemIds, itemPrices);

    it('sets bot entries at once', async () => {
      const { shop } = await deployShopFixture();
      const tx = await shop.setConfigRoot(arweaveId1, otherValidItemsRoot);
      await tx.wait();

      expect(await shop.getItemsRoot()).to.equal(otherValidItemsRoot);
      expect(await shop.getConfig()).to.equal(arweaveId1);
    });

    it('reverts when shop is closed', async () => {
      const { shop, owner } = await deployShopFixture();
      await shop.closeShop(owner.address);

      await expect(
        shop.setConfigRoot(arweaveId1, otherValidItemsRoot)
      ).to.be.revertedWith("shop closed");
    });

    it('reverts when it is not shop owner', async () => {
      const { shop, addr1 } = await deployShopFixture();

      await expect(
        shop.connect(addr1).setConfigRoot(arweaveId1, otherValidItemsRoot)
      ).to.be.revertedWith("not owner");
    });
  });

  describe('#setPaymentProcessor', async () => {
    const paymentProcessorAddr = '0xb5f4af1a4B5021Ae10207E1C2E119ce8249B3007'

    it('sets setPaymentProcessor', async () => {
      const { shop } = await deployShopFixture();
      const tx = await shop.setPaymentProcessor(paymentProcessorAddr);
      await tx.wait();

      expect(await shop.getPaymentProcessor()).to.equal(paymentProcessorAddr);
    });

    it('reverts when shop is closed', async () => {
      const { shop, owner } = await deployShopFixture();
      await shop.closeShop(owner.address);

      await expect(
        shop.setPaymentProcessor(paymentProcessorAddr)
      ).to.be.revertedWith("shop closed");
    });

    it('reverts when it is not shop owner', async () => {
      const { shop, addr1 } = await deployShopFixture();

      await expect(
        shop.connect(addr1).setPaymentProcessor(paymentProcessorAddr)
      ).to.be.revertedWith("not owner");
    });
  });

  describe('#buy', async () => {
    let shop: W3Shop
    let itemReceiver: SignerWithAddress;
    let fakePaymentProcessor: SignerWithAddress;
    let shopItems: W3ShopItems;
    let existingItemId: BigNumber;

    this.beforeAll(async () => {
      const fixture = await deployShopFixture();
      shop = fixture.shop;
      itemReceiver = fixture.addr1;
      fakePaymentProcessor = fixture.addr1
      shopItems = fixture.shopItems;
      existingItemId = fixture.existingItemIds[0];
    });

    describe('when called via payment processor', async () => {
      this.beforeAll(async () => {
        await shop.setPaymentProcessor(fakePaymentProcessor.address);
        expect(await shop.getPaymentProcessor()).to.equal(fakePaymentProcessor.address);
      });

      it('reverts when owner item ID is included', async () => {
        const ownerTokenId = await shop.getOwnerTokenId();

        await expect(
          shop.connect(fakePaymentProcessor).buy(itemReceiver.address, [1], [ownerTokenId])
        ).to.be.revertedWith("item non-exist");
      });

      it('mints the items', async () => {
        await shop.connect(fakePaymentProcessor).buy(itemReceiver.address, [1], [existingItemId]);

        expect(await shopItems.balanceOf(itemReceiver.address, existingItemId)).to.equal(1);
      });

      describe('when buying limited items', async () => {
        let limitedItems: BigNumber[];

        this.beforeAll(async () => {
          const prepedId0 = (await shop.getBufferedItemIds())[0];
          const prepedId1 = (await shop.getBufferedItemIds())[1];
          const prepedId2 = (await shop.getBufferedItemIds())[2];

          limitedItems = [prepedId0, prepedId1, prepedId2];
          const itemUris = [...Array(3)].map(_ => arweaveId1);
          const itemLimits = [
            BigNumber.from(1),
            BigNumber.from(10),
            // We can only buy up to 2 ** 256 - 2 items because on how we save the max amount.
            ethers.constants.MaxUint256.sub(1)
          ];

          const tx = await shop.setItemUris(itemUris, itemLimits);
          await tx.wait();
        });

        it('reverts when trying to buy more then the limit amount', async () => {
          await expect(
            shop.connect(fakePaymentProcessor).buy(itemReceiver.address, [11], [limitedItems[1]])
          ).to.be.revertedWith("sold out");
        });

        it('can buy exactly the limited amount', async () => {
          await expect(
            shop.connect(fakePaymentProcessor).buy(itemReceiver.address, [1], [limitedItems[0]])
          ).to.be.not.reverted;
          await expect(
            shop.connect(fakePaymentProcessor).buy(itemReceiver.address, [1], [limitedItems[0]])
          ).to.be.revertedWith("sold out");
        });

        it('can buy until the limited amount is reached', async () => {
          await expect(
            shop.connect(fakePaymentProcessor).buy(itemReceiver.address, [5], [limitedItems[1]])
          ).to.be.not.reverted;
          await expect(
            shop.connect(fakePaymentProcessor).buy(itemReceiver.address, [5], [limitedItems[1]])
          ).to.be.not.reverted;
          await expect(
            shop.connect(fakePaymentProcessor).buy(itemReceiver.address, [1], [limitedItems[1]])
          ).to.be.revertedWith("sold out");
        });

        it('reverts when attempted to buy more than MAX_UINT256 total', async () => {
          await expect(
            shop.connect(fakePaymentProcessor).buy(
              itemReceiver.address,
              [ethers.constants.MaxUint256.sub(10)],
              [limitedItems[2]]
            )
          ).to.be.not.reverted;

          await expect(
            shop.connect(fakePaymentProcessor).buy(itemReceiver.address, [10], [limitedItems[2]])
          ).to.be.revertedWith("sold out");

          await expect(
            shop.connect(fakePaymentProcessor).buy(itemReceiver.address, [9], [limitedItems[2]])
          ).to.be.not.reverted;

          await expect(
            shop.connect(fakePaymentProcessor).buy(itemReceiver.address, [1], [limitedItems[2]])
          ).to.be.revertedWith("sold out");
        });
      });
    });

    describe('when called directly', async () => {
      it('reverts when it is not payment processor', async () => {
        await expect(shop.buy(itemReceiver.address, [1], [1])).to.be.revertedWith("only processor");
      });
    });
  });

  describe('#cashout', async () => {
    it('reverts when it is not shop owner', async () => {
      const { shop, addr1 } = await deployShopFixture();

      await expect(
        shop.connect(addr1).cashout(addr1.address)
      ).to.be.revertedWith("not owner");
    });

    it('reverts when shop is closed', async () => {
      const { shop, owner } = await deployShopFixture();

      await shop.closeShop(owner.address);

      await expect(
        shop.cashout(owner.address)
      ).to.be.revertedWith("shop closed");
    });

    it('sends funds if currency set to ETH', async () => {
      const { shop, owner } = await deployShopFixture();

      await owner.sendTransaction({ to: shop.address, value: parseEther('1') });
      expect(await ethers.provider.getBalance(shop.address)).to.eq(parseEther('1'));

      await shop.cashout(owner.address);

      expect(await ethers.provider.getBalance(shop.address)).to.eq(parseEther('0'));
    });

    it('sends funds if currency set to an ERC20', async () => {
      const { mockTokenERC20 } = await deployMockTokens();
      const { shop, owner, addr1 } = await deployShopFixture();

      const tx = await shop.setAcceptedCurrency(owner.address, mockTokenERC20.address);
      await tx.wait();

      await mockTokenERC20.transfer(shop.address, 10000);

      await shop.cashout(addr1.address);

      expect(await mockTokenERC20.balanceOf(addr1.address)).to.eq(10000);
    });

    xit('sends funds if currency set to an ERC1155', async () => {

    });
  });

  describe('#closeShop', async () => {
    it('reverts when it is not shop owner', async () => {
      const { shop, addr1 } = await deployShopFixture();

      await expect(
        shop.connect(addr1).closeShop(addr1.address)
      ).to.be.revertedWith("not owner");
    });

    it('reverts when shop is closed', async () => {
      const { shop, owner } = await deployShopFixture();

      await shop.closeShop(owner.address);

      await expect(
        shop.closeShop(owner.address)
      ).to.be.revertedWith("shop closed");
    });

    it('performs a cashout of funds', async () => {
      const { shop, owner } = await deployShopFixture();

      await owner.sendTransaction({ to: shop.address, value: parseEther('1') });
      expect(await ethers.provider.getBalance(shop.address)).to.eq(parseEther('1'));

      await shop.closeShop(owner.address);

      expect(await ethers.provider.getBalance(shop.address)).to.eq(parseEther('0'));
    });
  });

  describe('#setAcceptedCurrency', async () => {
    const erc20Addr = '0xb5f4af1a4B5021Ae10207E1C2E119ce8249B3007';
    const zeroAddr = '0x0000000000000000000000000000000000000000';

    describe("when set to non ETH", async () => {
      it('sending direct ETH reverts', async () => {
        throw new Error();
      });
    });

    describe("when set to ETH", async () => {
      it('sending direct ETH is possible', async () => {
        throw new Error();
      });
    });

    it('sets currency', async () => {
      const { shop, owner } = await deployShopFixture();
      const tx = await shop.setAcceptedCurrency(owner.address, erc20Addr);
      await tx.wait();

      expect(await shop.getAcceptedCurrency()).to.equal(erc20Addr);
    });

    it('when set performs a cashout', async () => {
      const { shop, owner } = await deployShopFixture();
      let tx = await shop.setAcceptedCurrency(owner.address, zeroAddr);
      await tx.wait();
      expect(await shop.getAcceptedCurrency()).to.equal(zeroAddr);

      const provider = shop.provider;

      // Check if contract is empty.
      expect(await provider.getBalance(shop.address)).to.eq(parseEther('0'));

      // Send the contract 1 ETH
      tx = await owner.sendTransaction({ to: shop.address, value: parseEther('1') });
      await tx.wait();

      // Check if contract has 1 ETH
      expect(await provider.getBalance(shop.address)).to.eq(parseEther('1'));

      // Trigger currency change
      tx = await shop.setAcceptedCurrency(owner.address, zeroAddr);
      await tx.wait();

      // Check if contract is empty.
      expect(await provider.getBalance(shop.address)).to.eq(parseEther('0'));
    });

    it('reverts when shop is closed', async () => {
      const { shop, owner } = await deployShopFixture();
      await shop.closeShop(owner.address);

      await expect(
        shop.setAcceptedCurrency(owner.address, zeroAddr)
      ).to.be.revertedWith("shop closed");
    });

    it('reverts when it is not shop owner', async () => {
      const { shop, addr1 } = await deployShopFixture();

      await expect(
        shop.connect(addr1).setAcceptedCurrency(addr1.address, zeroAddr)
      ).to.be.revertedWith("not owner");
    });
  });
});
