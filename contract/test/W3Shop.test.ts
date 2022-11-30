import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { W3Shop } from '../typechain-types';
import { deployShopFixture, ownerMetaUri, shopConfigUri, shopContractUri } from './fixture';
import { makeMerkleRoot } from './proof-helper';

const arweaveId1 = 'ar://AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const shopConfig = 'ar://shopConfig000000000000000000000000000000000';

const itemPricesNumbers = [12000000000, 30000000000, 50000000000];
const itemPrices = itemPricesNumbers.map((prices) => BigNumber.from(prices));

describe('W3Shop', async function () {

  describe('#constructor', async () => {
    it('mints the special owner NFT', async () => {
      const { shop, owner } = await loadFixture(deployShopFixture);

      expect(await shop.balanceOf(owner.address, 0)).to.equal(1);
    });

    it('sets the correct NFT URI in item registry', async () => {
      const { shop } = await loadFixture(deployShopFixture);
      expect(await shop.uri(0)).to.equal(ownerMetaUri);
    });

    it('sets the correct shop config', async () => {
      const { shop } = await loadFixture(deployShopFixture);
      expect(await shop.getConfig()).to.equal(shopConfig);
    });

    it('has set IDs for the upcoming item registration', async () => {
      const { shop } = await loadFixture(deployShopFixture);
      expect(await shop.getNextItemId()).to.equal(4);
    });

    it('sets the contract uri', async () => {
      const { shop } = await loadFixture(deployShopFixture);
      expect(await shop.contractURI()).to.equal(shopContractUri);
    });

    it('sets name of the shop', async () => {
      const { shop } = await loadFixture(deployShopFixture);
      expect(await shop.name()).to.equal('Test');
    });

    it('sets the symbol', async () => {
      const { shop } = await loadFixture(deployShopFixture);
      expect(await shop.symbol()).to.equal('W3SITM');
    });
  });

  describe('#initialize', async () => {
    it('was already called by factory and reverts when called again', async () => {
      const { shop, owner } = await loadFixture(deployShopFixture);

      await expect(
        shop.initialize({
          owner: owner.address,
          name: "Test 2",
          ownerMetaUri: ownerMetaUri,
          shopConfigUri: shopConfigUri,
          shopContractUri: shopContractUri,
          paymentProcessor: owner.address,
          paymentReceiver: owner.address
        })
      ).to.be.revertedWith("already initialized");
    });
  });

  describe('#setContractURI', async () => {
    it('sets the contractURI when called by owner', async () => {
      const { shop } = await deployShopFixture();
      await shop.setContractURI('abc');
      expect(await shop.contractURI()).to.equal('abc');
    });

    it('reverts when not called by owner', async () => {
      const { shop, addr1 } = await deployShopFixture();

      await expect(shop.connect(addr1).setContractURI('abc'))
        .to.be.revertedWith('not owner');
    });
  });

  describe('#setPaymentProcessor', async () => {
    it('sets the setPaymentProcessor when called by owner', async () => {
      const { shop, addr1 } = await deployShopFixture();

      await shop.setPaymentProcessor(addr1.address);

      expect(await shop.getPaymentProcessor()).to.equal(addr1.address);
    });

    it('reverts when not called by owner', async () => {
      const { shop, addr1 } = await deployShopFixture();

      await expect(shop.connect(addr1).setPaymentProcessor(addr1.address))
        .to.be.revertedWith('not owner');
    });
  });

  describe('#getPaymentProcessor', async () => {
    it('returns the setPaymentProcessor', async () => {
      const { shop, addr1 } = await deployShopFixture();

      await shop.setPaymentProcessor(addr1.address);

      expect(await shop.getPaymentProcessor()).to.equal(addr1.address);
    });
  });

  describe('#getNextItemId', async () => {
    it('returns the next available item id', async () => {
      const { shop } = await deployShopFixture();

      expect(await shop.getNextItemId()).to.equal(4);
    });
  });

  describe('#setName', async () => {
    it('sets the name of the contract', async () => {
      const { shop } = await loadFixture(deployShopFixture);

      await shop.setName('W3Shop');

      expect(await shop.name()).to.equal('W3Shop');
    });

    it('reverts when not called by owner', async () => {
      const { shop, addr1 } = await loadFixture(deployShopFixture);

      await expect(shop.connect(addr1).setName('W3Shop'))
        .to.be.revertedWith('not owner');
    });
  });

  describe('#symbol', async () => {
    it('returns the symbol of the contract', async () => {
      const { shop } = await loadFixture(deployShopFixture);

      expect(await shop.symbol()).to.equal('W3SITM');
    });
  });

  describe('#setPaymentReceiver', async () => {
    it('reverts when not owner', async () => {
      const { shop, addr1 } = await loadFixture(deployShopFixture);

      await expect(shop.connect(addr1).setPaymentReceiver(addr1.address))
        .to.be.revertedWith('not owner');
    });

    it('reverts when shop closed', async () => {
      const { shop, addr1 } = await loadFixture(deployShopFixture);

      await shop.closeShop();

      await expect(shop.setPaymentReceiver(addr1.address))
        .to.be.revertedWith('not owner');
    });

    it('sets the payment receiver address when called by owner', async () => {
      const { shop, addr1 } = await loadFixture(deployShopFixture);

      await shop.setPaymentReceiver(addr1.address);

      expect(await shop.getPaymentReceiver()).to.eq(addr1.address);
    });
  });

  describe('#getCurrentItemCount', async () => {
    it('returns 0 for unkown items', async () => {
      const { shop } = await loadFixture(deployShopFixture);

      expect(await shop.getCurrentItemCount(10000)).to.eq(0);
    });

    it('returns the 0 for existing but not yet sold item', async () => {
      const { shop } = await loadFixture(deployShopFixture);

      expect(await shop.getCurrentItemCount(0)).to.eq(0);
    });
  });

  describe('#isShopOwner', async () => {
    it('returns true for the shop owner', async () => {
      const { shop, owner } = await loadFixture(deployShopFixture);

      expect(await shop.isShopOwner(owner.address)).to.be.true;
    });

    it('returns false for a non shop owner', async () => {
      const { shop, addr1 } = await loadFixture(deployShopFixture);

      expect(await shop.isShopOwner(addr1.address)).to.be.false;
    });

    it('returns false when the shop is closed', async () => {
      const { shop, owner } = await loadFixture(deployShopFixture);

      await shop.closeShop();

      expect(await shop.isShopOwner(owner.address)).to.be.false;
    });
  });

  describe('#setAcceptedCurrency', async () => {
    it('sets currency if called by owner', async () => {
      const { shop } = await loadFixture(deployShopFixture);

      await shop.setAcceptedCurrency(ethers.constants.AddressZero);

      expect(await shop.getAcceptedCurrency()).to.eq(ethers.constants.AddressZero);
    });

    it('reverts when not shop owner', async () => {
      const { shop, addr1 } = await loadFixture(deployShopFixture);

      await expect(shop.connect(addr1).setAcceptedCurrency(ethers.constants.AddressZero))
        .to.be.revertedWith('not owner');
    });

    it('reverts when the shop is closed', async () => {
      const { shop } = await loadFixture(deployShopFixture);

      await shop.closeShop();

      await expect(shop.setAcceptedCurrency(ethers.constants.AddressZero))
        .to.be.revertedWith('not owner');
    });
  });

  describe('#setConfig', async () => {
    it('sets a new shop config', async () => {
      const { shop } = await loadFixture(deployShopFixture);
      const tx = await shop.setConfig(arweaveId1);
      await tx.wait();

      expect(await shop.getConfig()).to.equal(arweaveId1);
    });

    it('reverts when shop is closed', async () => {
      const { shop, owner } = await loadFixture(deployShopFixture);
      await shop.connect(owner).closeShop();

      await expect(
        shop.connect(owner).setConfig(arweaveId1)
      ).to.be.revertedWith('not owner');
    });

    it('reverts when it is not shop owner', async () => {
      const { shop, addr1 } = await loadFixture(deployShopFixture);

      await expect(
        shop.connect(addr1).setConfig(arweaveId1)
      ).to.be.revertedWith('not owner');
    });
  });

  describe('#setItemsRoot', async () => {
    const itemIds = [10, 20, 30].map((id) => BigNumber.from(id));
    const otherValidItemsRoot = makeMerkleRoot(itemIds, itemPrices);

    it('sets a new items root', async () => {
      const { shop } = await loadFixture(deployShopFixture);
      const tx = await shop.setItemsRoot(otherValidItemsRoot);
      await tx.wait();

      expect(await shop.getItemsRoot()).to.equal(otherValidItemsRoot);
    });

    it('reverts when shop is closed', async () => {
      const { shop, owner } = await loadFixture(deployShopFixture);
      await shop.closeShop();

      await expect(
        shop.setItemsRoot(otherValidItemsRoot)
      ).to.be.revertedWith('not owner');
    });

    it('reverts when it is not shop owner', async () => {
      const { shop, addr1 } = await loadFixture(deployShopFixture);

      await expect(
        shop.connect(addr1).setItemsRoot(otherValidItemsRoot)
      ).to.be.revertedWith('not owner');
    });
  });

  describe('#setConfigRoot', async () => {
    const itemIds = [10, 20, 30].map((id) => BigNumber.from(id));
    const otherValidItemsRoot = makeMerkleRoot(itemIds, itemPrices);

    it('sets bot entries at once', async () => {
      const { shop } = await loadFixture(deployShopFixture);
      const tx = await shop.setConfigRoot(arweaveId1, otherValidItemsRoot);
      await tx.wait();

      expect(await shop.getItemsRoot()).to.equal(otherValidItemsRoot);
      expect(await shop.getConfig()).to.equal(arweaveId1);
    });

    it('reverts when shop is closed', async () => {
      const { shop } = await loadFixture(deployShopFixture);
      await shop.closeShop();

      await expect(
        shop.setConfigRoot(arweaveId1, otherValidItemsRoot)
      ).to.be.revertedWith('not owner');
    });

    it('reverts when it is not shop owner', async () => {
      const { shop, addr1 } = await loadFixture(deployShopFixture);

      await expect(
        shop.connect(addr1).setConfigRoot(arweaveId1, otherValidItemsRoot)
      ).to.be.revertedWith('not owner');
    });
  });

  describe('#supportsInterface', async function () {
    it('returns true for ERC1155', async function () {
      const INTERFACE_ID_ERC1155 = '0x01ffc9a7';
      const { shop } = await loadFixture(deployShopFixture);

      expect(await shop.supportsInterface(INTERFACE_ID_ERC1155)).to.be.true;
    });

    it('returns true for ERC2981', async function () {
      const INTERFACE_ID_ERC2981 = '0x2a55205a';
      const { shop } = await loadFixture(deployShopFixture);

      expect(await shop.supportsInterface(INTERFACE_ID_ERC2981)).to.be.true;
    });

    it('returns false for wrong interface id', async function () {
      const INTERFACE_ID_ERC2981 = '0xff55205a';
      const { shop } = await loadFixture(deployShopFixture);

      expect(await shop.supportsInterface(INTERFACE_ID_ERC2981)).to.be.false;
    });
  });

  describe('#uri', async function () {
    it('returns the uri for the given token id ', async function () {
      const { shop } = await loadFixture(deployShopFixture);

      expect(await shop.uri(1)).to.equal(arweaveId1);
    });
  });

  describe('#setTokenRoyalty', async function () {
    it('reverts when called setting royality of a non existing item', async function () {
      const { shop, owner } = await loadFixture(deployShopFixture);

      await expect(
        shop.setTokenRoyalty(10000, owner.address, 1000)
      ).to.be.revertedWith('item not prepared');

      const nextToken = await shop.getNextItemId();
      await expect(
        shop.setTokenRoyalty(nextToken, owner.address, 1000)
      ).to.be.revertedWith('item not prepared');
    });

    it('sets the royality for a token when called from owner', async function () {
      const { shop, owner } = await loadFixture(deployShopFixture);

      await expect(
        shop.setTokenRoyalty(1, owner.address, 1000)
      ).to.be.not.revertedWith('not owner');
    });

    it('reverts when not called from owner', async function () {
      const { shop, addr1 } = await loadFixture(deployShopFixture);

      await expect(
        shop.connect(addr1).setTokenRoyalty(1, addr1.address, 100)
      ).to.be.revertedWith('not owner');
    });

    it('sets the royalty', async () => {
      const { shop, owner, existingItemIds } = await loadFixture(deployShopFixture);

      await expect(
        shop.setTokenRoyalty(existingItemIds[0], owner.address, 1000)
      ).to.be.not.reverted;
    });

    describe('#getTokenRoyality', async function () {
      it('returns the set royality', async function () {
        const { shop, owner } = await loadFixture(deployShopFixture);

        await shop.setTokenRoyalty(1, owner.address, 100);
        const [receiver, royaltyAmount] = await shop.royaltyInfo(1, 100);

        expect(receiver).to.eq(owner.address);
        expect(royaltyAmount).to.eq(1);
      });
    });
  });

  describe('#prepareItems', async function () {
    it('reverts when not owner', async () => {
      const { shop, addr1 } = await loadFixture(deployShopFixture);

      await expect(
        shop.connect(addr1).prepareItems([arweaveId1], [0])
      ).to.be.revertedWith("not owner");
    });

    it('reverts when shop is closed', async () => {
      const { shop, owner } = await loadFixture(deployShopFixture);
      await shop.connect(owner).closeShop();

      await expect(
        shop.connect(owner).prepareItems([arweaveId1], [0])
      ).to.be.revertedWith("not owner");
    });

    it('sets item uris and item limits', async () => {
      const { shop } = await loadFixture(deployShopFixture);

      const nextItemId = await shop.getNextItemId();

      const reservedIds = [nextItemId, nextItemId.add(1)];
      const itemUris = reservedIds.map(_ => arweaveId1);

      await expect(shop.prepareItems(itemUris, [0, 0]))
        .to.emit(shop, "AddedShopItems")
        .withArgs(reservedIds);
    });

    it('reverts when url count > 5', async () => {
      const { shop } = await loadFixture(deployShopFixture);

      const itemUris = [...Array(6)].map(_ => arweaveId1);
      const itemAmounts = [...Array(6)].map(_ => 0);

      await expect(
        shop.prepareItems(itemUris, itemAmounts)
      ).to.be.revertedWith("invalid uri count");
    });

    it('reverts when url count = 0', async () => {
      const { shop } = await loadFixture(deployShopFixture);

      await expect(
        shop.prepareItems([], [])
      ).to.be.revertedWith("invalid uri count");
    });

    it('reverts called with unequal length data', async () => {
      const { shop } = await loadFixture(deployShopFixture);

      const itemUris = [...Array(3)].map(_ => arweaveId1);

      await expect(shop.prepareItems(itemUris, [0, 0]))
        .to.be.revertedWith('unequal length');
    });

    it('reverts called empty uri', async () => {
      const { shop } = await loadFixture(deployShopFixture);

      await expect(shop.prepareItems([''], [0]))
        .to.be.revertedWith('uri empty');
    });

    it('sets a limit for the items', async () => {
      const { shop } = await loadFixture(deployShopFixture);

      const nextItemId = await shop.getNextItemId();
      const prepedId0 = nextItemId;
      const prepedId1 = nextItemId.add(1);
      const prepedId2 = nextItemId.add(2);

      const itemUris = [...Array(3)].map(_ => arweaveId1);

      await shop.prepareItems(itemUris, [0, 1, 10]);

      expect(await shop.getMaximumItemCount(prepedId0)).to.eq(ethers.constants.MaxUint256);
      expect(await shop.getMaximumItemCount(prepedId1)).to.eq(1);
      expect(await shop.getMaximumItemCount(prepedId2)).to.eq(10);
    });

    it('reverts when limit is out of range', async () => {
      const { shop } = await loadFixture(deployShopFixture);

      expect(await shop.prepareItems([arweaveId1], [0])).to.be.reverted;
    });
  });

  describe('#setPaymentProcessor', async () => {
    const paymentProcessorAddr = '0xb5f4af1a4B5021Ae10207E1C2E119ce8249B3007'

    it('sets setPaymentProcessor', async () => {
      const { shop } = await loadFixture(deployShopFixture);
      const tx = await shop.setPaymentProcessor(paymentProcessorAddr);
      await tx.wait();

      expect(await shop.getPaymentProcessor()).to.equal(paymentProcessorAddr);
    });

    it('reverts when shop is closed', async () => {
      const { shop } = await loadFixture(deployShopFixture);
      await shop.closeShop();

      await expect(
        shop.setPaymentProcessor(paymentProcessorAddr)
      ).to.be.revertedWith("not owner");
    });

    it('reverts when it is not shop owner', async () => {
      const { shop, addr1 } = await loadFixture(deployShopFixture);

      await expect(
        shop.connect(addr1).setPaymentProcessor(paymentProcessorAddr)
      ).to.be.revertedWith("not owner");
    });
  });

  describe('#buy', async () => {
    let shop: W3Shop
    let itemReceiver: SignerWithAddress;
    let fakePaymentProcessor: SignerWithAddress;
    let existingItemId: BigNumber;

    this.beforeAll(async () => {
      const fixture = await deployShopFixture();

      shop = fixture.shop;
      itemReceiver = fixture.addr1;
      fakePaymentProcessor = fixture.addr1;
      existingItemId = fixture.existingItemIds[0];
    });

    describe('when called via payment processor', async () => {
      this.beforeAll(async () => {
        await shop.setPaymentProcessor(fakePaymentProcessor.address);
      });

      it('reverts when owner item ID is included', async () => {
        await expect(
          shop.connect(fakePaymentProcessor).buy(itemReceiver.address, [1], [0])
        ).to.be.revertedWith("invalid item");
      });

      it('reverts when item is not yet prepared', async () => {
        await expect(
          shop.connect(fakePaymentProcessor).buy(itemReceiver.address, [1], [100])
        ).to.be.revertedWith("item not prepared");
      });

      it('mints the items to the receiver', async () => {
        expect(await shop.balanceOf(itemReceiver.address, existingItemId)).to.equal(0);

        await shop.connect(fakePaymentProcessor).buy(itemReceiver.address, [1], [existingItemId]);

        expect(await shop.balanceOf(itemReceiver.address, existingItemId)).to.equal(1);
      });

      it('emits a Buy event', async () => {
        expect(
          await shop.connect(fakePaymentProcessor).buy(itemReceiver.address, [4], [existingItemId])
        ).to.emit(shop, 'Buy')
          .withArgs(itemReceiver.address, [existingItemId], [4]);
      });

      describe('#getItemCount', async () => {
        it('returns the right number after an item was bought', async () => {
          // To be safe we create a new item.
          const nextItem = await shop.getNextItemId();
          await shop.prepareItems([arweaveId1], [100]);

          await shop.connect(fakePaymentProcessor).buy(itemReceiver.address, [3], [nextItem]);

          expect(await shop.getCurrentItemCount(nextItem)).to.eq(3);
          expect(await shop.getMaximumItemCount(nextItem)).to.eq(100);
        });
      });

      describe('when buying limited items', async () => {
        let limitedItems: BigNumber[];

        this.beforeAll(async () => {
          const nextItemId = await shop.getNextItemId();
          const prepedId0 = nextItemId;
          const prepedId1 = nextItemId.add(1);
          const prepedId2 = nextItemId.add(2);

          limitedItems = [prepedId0, prepedId1, prepedId2];
          const itemUris = [...Array(3)].map(_ => arweaveId1);
          const itemLimits = [
            BigNumber.from(1),
            BigNumber.from(10),
            // We can only buy up to 2 ** 32 - 2 items because on how we save the max amount.
            BigNumber.from(2 ** 32 - 2)
          ];

          const tx = await shop.prepareItems(itemUris, itemLimits);
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

        it('reverts when attempted to buy more than max UINT32', async () => {
          await expect(
            shop.connect(fakePaymentProcessor).buy(
              itemReceiver.address,
              [BigNumber.from(2 ** 32 - 2).sub(9)],
              [limitedItems[2]]
            )
          ).to.not.be.reverted;

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

    describe('when called by non payment processor', async () => {
      it('reverts', async () => {
        await expect(shop.buy(itemReceiver.address, [1], [1])).to.be.revertedWith("only processor");
      });
    });
  });

  describe('#getMaximumItemCount', async () => {
    it('reverts when item has not yet been prepared', async () => {
      const { shop } = await deployShopFixture();

      await expect(
        shop.getMaximumItemCount(123)
      ).to.be.revertedWith("item not prepared");
    });

    it('returns UINT256 when item is unlimited', async () => {
      const { shop } = await deployShopFixture();

      const nextItemId = await shop.getNextItemId();
      await shop.prepareItems([arweaveId1], [0]);

      expect(
        await shop.getMaximumItemCount(nextItemId)
      ).to.equal(ethers.constants.MaxUint256);
    });

    it('returns the correct limit when item has one', async () => {
      const { shop } = await deployShopFixture();

      const nextItemId = await shop.getNextItemId();
      await shop.prepareItems([arweaveId1], [1]);

      expect(
        await shop.getMaximumItemCount(nextItemId)
      ).to.equal(1);
    });
  });

  describe('#closeShop', async () => {
    it('reverts when it is not shop owner', async () => {
      const { shop, addr1 } = await deployShopFixture();

      await expect(
        shop.connect(addr1).closeShop()
      ).to.be.revertedWith("not owner");
    });

    it('reverts when shop is closed', async () => {
      const { shop } = await deployShopFixture();

      await shop.closeShop();

      await expect(
        shop.closeShop()
      ).to.be.revertedWith("not owner");
    });

    it('closes the shop', async () => {
      const { shop } = await deployShopFixture();

      await expect(shop.closeShop()).to.be.not.reverted;
    });

    it('emits an Close event', async () => {
      const { shop } = await deployShopFixture();

      await expect(shop.closeShop())
        .to.emit(shop, "ShopClosed");
    });
  });
});
