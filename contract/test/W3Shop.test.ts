import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { BigNumber, ContractReceipt } from 'ethers';
import { parseEther } from 'ethers/lib/utils';
import {
  ethers
} from 'hardhat';
import {
  W3Shop, W3ShopFactory, PaymentProcessor, W3ShopItems,
  MerkleMultiProof
} from '../typechain';
import { makeMerkleRoot } from './proof-helper';

const arweaveId1 = 'ar://AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

const shopConfig = 'ar://shopConfig000000000000000000000000000000000';
const ownerNftId = 'ar://ownerNftId000000000000000000000000000000000';

const itemPricesNumbers = [12000000000, 30000000000, 50000000000];
const itemPrices = itemPricesNumbers.map((prices) => BigNumber.from(prices));

// We define a fixture to reuse the same setup in every test. We use
// loadFixture to run this setup once, snapshot that state, and reset Hardhat
// Network to that snapshopt in every test.
async function deployShopFixture() {
  const W3ShopFactory = await ethers.getContractFactory('W3ShopFactory');
  const factory = (await W3ShopFactory.deploy()) as W3ShopFactory;
  await factory.deployed();

  const MerkleMultiProof = await ethers.getContractFactory('MerkleMultiProof');
  const merkleProof = (await MerkleMultiProof.deploy()) as MerkleMultiProof;
  await merkleProof.deployed();

  const PaymentProcessor = await ethers.getContractFactory('PaymentProcessor', {
    libraries: {
      MerkleMultiProof: merkleProof.address,
    },
  });
  const paymentProcessor = (await PaymentProcessor.deploy()) as PaymentProcessor;
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

  const sut = await ethers.getContractAt('W3Shop', eventCreatedArgs.shop) as W3Shop;

  const prepareItemTx = await sut.prepareItems(3);
  const prepareItemReceipt = await prepareItemTx.wait();
  const eventReservedItems = prepareItemReceipt.events?.find((x) => x.event === 'ReservedItems')!;
  const eventReservedItemsArgs = eventReservedItems.args!;
  const existingItemIds = eventReservedItemsArgs.ids as BigNumber[];
  // Finalize the item creation.
  const itemUris = existingItemIds.map(_ => arweaveId1);
  const setItemUrisTx = await sut.setItemUris(existingItemIds, itemUris);
  await setItemUrisTx.wait();

  const validItemsRoot = makeMerkleRoot(existingItemIds, itemPrices);
  const setItemsRootTx = await sut.setItemsRoot(validItemsRoot);
  await setItemsRootTx.wait();

  // Fixtures can return anything you consider useful for your tests
  return { sut, shopItems, owner, paymentProcessor, addr1, addr2, existingItemIds };
}

describe('W3Shop', async function () {

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
      const { sut } = await deployShopFixture();

      await expect(sut.prepareItems(2))
        .to.emit(sut, "ReservedItems")
        .withArgs([5, 6])
    });

    it('reverts when shop is closed', async () => {
      const { sut, owner } = await deployShopFixture();
      await sut.connect(owner).closeShop(owner.address);

      await expect(
        sut.connect(owner).prepareItems(2)
      ).to.be.revertedWith("shop closed");
    });

    it('reverts when it is not shop owner', async () => {
      const { sut, addr1 } = await deployShopFixture();

      await expect(
        sut.connect(addr1).prepareItems(2)
      ).to.be.revertedWith("not owner");
    });
  });

  describe('#setItemUris', async () => {
    it('reverts when not owner', async () => {
      const { sut, addr1 } = await deployShopFixture();

      await expect(
        sut.connect(addr1).setItemUris([2], [arweaveId1])
      ).to.be.revertedWith("not owner");
    });

    it('reverts when shop is closed', async () => {
      const { sut, owner } = await deployShopFixture();
      await sut.connect(owner).closeShop(owner.address);

      await expect(
        sut.connect(owner).setItemUris([2], [arweaveId1])
      ).to.be.revertedWith("shop closed");
    });

    it('reverts when existing item is set', async () => {
      const { sut, existingItemIds } = await deployShopFixture();

      await expect(
        sut.setItemUris([existingItemIds[0]], [arweaveId1])
      ).to.be.revertedWith("item already exists");
    });

    it('sets item uris for reserved items', async () => {
      const { sut } = await deployShopFixture();
      const prepareItemTx = await sut.prepareItems(1);
      const prepareItemReceipt = await prepareItemTx.wait();
      const eventReservedItems = prepareItemReceipt.events?.find((x) => x.event === 'ReservedItems')!;
      const eventReservedItemsArgs = eventReservedItems.args!;
      const existingItemIds = eventReservedItemsArgs.ids as BigNumber[];
      const itemUris = existingItemIds.map(_ => arweaveId1);

      await expect(sut.setItemUris(existingItemIds, itemUris))
        .to.emit(sut, "NewShopItems")
        .withArgs(existingItemIds)
    });

    it('reverts when item is not reserved', async () => {
      const { sut } = await deployShopFixture();

      await expect(
        sut.setItemUris([20], [arweaveId1])
      ).to.be.revertedWith("item not reserved");
    });
  });

  describe('#setConfig', async () => {
    it('sets a new shop config', async () => {
      const { sut } = await deployShopFixture();
      const tx = await sut.setConfig(arweaveId1);
      await tx.wait();

      expect(await sut.shopConfig()).to.equal(arweaveId1);
    });

    it('reverts when shop is closed', async () => {
      const { sut, owner } = await deployShopFixture();
      await sut.connect(owner).closeShop(owner.address);

      await expect(
        sut.connect(owner).setConfig(arweaveId1)
      ).to.be.revertedWith("shop closed");
    });

    it('reverts when it is not shop owner', async () => {
      const { sut, addr1 } = await deployShopFixture();

      await expect(
        sut.connect(addr1).setConfig(arweaveId1)
      ).to.be.revertedWith("not owner");
    });
  });

  describe('#setItemsRoot', async () => {
    const itemIds = [10, 20, 30].map((id) => BigNumber.from(id));
    const otherValidItemsRoot = makeMerkleRoot(itemIds, itemPrices);

    it('sets a new items root', async () => {
      const { sut } = await deployShopFixture();
      const tx = await sut.setItemsRoot(otherValidItemsRoot);
      await tx.wait();

      expect(await sut.itemsRoot()).to.equal(otherValidItemsRoot);
    });

    it('reverts when shop is closed', async () => {
      const { sut, owner } = await deployShopFixture();
      await sut.closeShop(owner.address);

      await expect(
        sut.setItemsRoot(otherValidItemsRoot)
      ).to.be.revertedWith("shop closed");
    });

    it('reverts when it is not shop owner', async () => {
      const { sut, addr1 } = await deployShopFixture();

      await expect(
        sut.connect(addr1).setItemsRoot(otherValidItemsRoot)
      ).to.be.revertedWith("not owner");
    });
  });

  describe('#setConfigRoot', async () => {
    const itemIds = [10, 20, 30].map((id) => BigNumber.from(id));
    const otherValidItemsRoot = makeMerkleRoot(itemIds, itemPrices);

    it('sets bot entries at once', async () => {
      const { sut } = await deployShopFixture();
      const tx = await sut.setConfigRoot(arweaveId1, otherValidItemsRoot);
      await tx.wait();

      expect(await sut.itemsRoot()).to.equal(otherValidItemsRoot);
      expect(await sut.shopConfig()).to.equal(arweaveId1);
    });

    it('reverts when shop is closed', async () => {
      const { sut, owner } = await deployShopFixture();
      await sut.closeShop(owner.address);

      await expect(
        sut.setConfigRoot(arweaveId1, otherValidItemsRoot)
      ).to.be.revertedWith("shop closed");
    });

    it('reverts when it is not shop owner', async () => {
      const { sut, addr1 } = await deployShopFixture();

      await expect(
        sut.connect(addr1).setConfigRoot(arweaveId1, otherValidItemsRoot)
      ).to.be.revertedWith("not owner");
    });
  });

  describe('#setPaymentProcessor', async () => {
    const paymentProcessorAddr = '0xb5f4af1a4B5021Ae10207E1C2E119ce8249B3007'

    it('sets setPaymentProcessor', async () => {
      const { sut } = await deployShopFixture();
      const tx = await sut.setPaymentProcessor(paymentProcessorAddr);
      await tx.wait();

      expect(await sut.paymentProcessor()).to.equal(paymentProcessorAddr);
    });

    it('reverts when shop is closed', async () => {
      const { sut, owner } = await deployShopFixture();
      await sut.closeShop(owner.address);

      await expect(
        sut.setPaymentProcessor(paymentProcessorAddr)
      ).to.be.revertedWith("shop closed");
    });

    it('reverts when it is not shop owner', async () => {
      const { sut, addr1 } = await deployShopFixture();

      await expect(
        sut.connect(addr1).setPaymentProcessor(paymentProcessorAddr)
      ).to.be.revertedWith("not owner");
    });
  });

  describe('#buy', async () => {
    let sut: W3Shop
    let itemReceiver: SignerWithAddress;
    let fakePaymentProcessor: SignerWithAddress;
    let shopItems: W3ShopItems;
    let existingItemId: BigNumber;

    this.beforeAll(async () => {
      const fixture = await deployShopFixture();
      sut = fixture.sut;
      itemReceiver = fixture.addr1;
      fakePaymentProcessor = fixture.addr1
      shopItems = fixture.shopItems;
      existingItemId = fixture.existingItemIds[0];
    });

    describe('when called via payment processor', async () => {
      this.beforeAll(async () => {
        await sut.setPaymentProcessor(fakePaymentProcessor.address);
        expect(await sut.paymentProcessor()).to.equal(fakePaymentProcessor.address);
      });

      it('reverts when owner item ID is included', async () => {
        const ownerTokenId = await sut.ownerTokenId();

        await expect(
          sut.connect(fakePaymentProcessor).buy(itemReceiver.address, [1], [ownerTokenId])
        ).to.be.revertedWith("item does not exist");
      });

      it('mints the items', async () => {
        await sut.connect(fakePaymentProcessor).buy(itemReceiver.address, [1], [existingItemId]);

        expect(await shopItems.balanceOf(itemReceiver.address, existingItemId)).to.equal(1);
      });
    });

    describe('when called directly', async () => {
      it('reverts when it is not payment processor', async () => {
        await expect(sut.buy(itemReceiver.address, [1], [1])).to.be.revertedWith("only processor");
      });
    });
  });

  describe('#cashout', async () => {
    it('reverts when it is not shop owner', async () => {
      const { sut, addr1 } = await deployShopFixture();

      await expect(
        sut.connect(addr1).cashout(addr1.address)
      ).to.be.revertedWith("not owner");
    });

    it('reverts when shop is closed', async () => {
      const { sut, owner } = await deployShopFixture();

      await sut.closeShop(owner.address);

      await expect(
        sut.cashout(owner.address)
      ).to.be.revertedWith("shop closed");
    });

    it('sends funds if currency set to ETH', async () => {
      const { sut, owner } = await deployShopFixture();

      await owner.sendTransaction({ to: sut.address, value: parseEther('1') });
      expect(await ethers.provider.getBalance(sut.address)).to.eq(parseEther('1'));

      await sut.cashout(owner.address);

      expect(await ethers.provider.getBalance(sut.address)).to.eq(parseEther('0'));
    });

    xit('sends funds if currency set to an ERC20', async () => {
      // TODO write test when ERC20 is fully supported.
    });
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
    const erc20Addr = '0xb5f4af1a4B5021Ae10207E1C2E119ce8249B3007';
    const zeroAddr = '0x0000000000000000000000000000000000000000';

    it('sets currency', async () => {
      const { sut, owner } = await deployShopFixture();
      const tx = await sut.setAcceptedCurrency(owner.address, erc20Addr);
      await tx.wait();

      expect(await sut.acceptedCurrency()).to.equal(erc20Addr);
    });

    it('performs a cashout', async () => {
      const { sut, owner } = await deployShopFixture();
      let tx = await sut.setAcceptedCurrency(owner.address, zeroAddr);
      await tx.wait();
      expect(await sut.acceptedCurrency()).to.equal(zeroAddr);

      const provider = sut.provider;

      // Check if contract is empty.
      expect(await provider.getBalance(sut.address)).to.eq(parseEther('0'));

      // Send the contract 1 ETH
      tx = await owner.sendTransaction({ to: sut.address, value: parseEther('1') });
      await tx.wait();

      // Check if contract has 1 ETH
      expect(await provider.getBalance(sut.address)).to.eq(parseEther('1'));

      // Trigger currency change
      tx = await sut.setAcceptedCurrency(owner.address, zeroAddr);
      await tx.wait();

      // Check if contract is empty.
      expect(await provider.getBalance(sut.address)).to.eq(parseEther('0'));
    });

    it('reverts when shop is closed', async () => {
      const { sut, owner } = await deployShopFixture();
      await sut.closeShop(owner.address);

      await expect(
        sut.setAcceptedCurrency(owner.address, zeroAddr)
      ).to.be.revertedWith("shop closed");
    });

    it('reverts when it is not shop owner', async () => {
      const { sut, addr1 } = await deployShopFixture();

      await expect(
        sut.connect(addr1).setAcceptedCurrency(addr1.address, zeroAddr)
      ).to.be.revertedWith("not owner");
    });
  });
});
