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
import { makeMerkleProof, makeMerkleRoot } from './proof-helper';

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

async function buyItem(
  sut: W3Shop,
  amounts: number[],
  proofItemsIds: BigNumber[],
  proofItemPrices: BigNumber[]
) {
  const { proof, proofFlags } = makeMerkleProof(
    itemIds,
    itemPrices,
    proofItemsIds,
    proofItemPrices
  );

  let totalPrice = BigNumber.from(0);
  for (let i = 0; i < proofItemPrices.length; i++) {
    totalPrice = totalPrice.add(proofItemPrices[i].mul(amounts[i]));
  }

  /*
  return sut.buy(amounts, proofItemPrices, proofItemsIds, proof, proofFlags, {
    value: totalPrice,
  });*/
}

describe('W3Shop', async function () {
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

    const event = receipt.events?.find((x) => x.event === 'Created')!;
    const eventArgs = event.args!;

    const sut = await ethers.getContractAt('W3Shop', eventArgs.shop) as W3Shop;

    // Fixtures can return anything you consider useful for your tests
    return { sut, shopItems, owner, paymentProcessor, addr1, addr2 };
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
      const { sut } = await deployShopFixture();

      await expect(sut.prepareItems(2))
        .to.emit(sut, "ReservedItems")
        .withArgs([2, 3])
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

  describe('#setConfigRoot', async () => {
    it('sets bot entries at once', async () => {
      const { sut } = await deployShopFixture();
      const tx = await sut.setConfigRoot(arweaveId1, validItemsRoot);
      await tx.wait();

      expect(await sut.itemsRoot()).to.equal(validItemsRoot);
      expect(await sut.shopConfig()).to.equal(arweaveId1);
    });

    it('reverts when shop is closed', async () => {
      const { sut, owner } = await deployShopFixture();
      await sut.closeShop(owner.address);

      await expect(
        sut.setConfigRoot(arweaveId1, validItemsRoot)
      ).to.be.revertedWith("shop closed");
    });

    it('reverts when it is not shop owner', async () => {
      const { sut, addr1 } = await deployShopFixture();

      await expect(
        sut.connect(addr1).setConfigRoot(arweaveId1, validItemsRoot)
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
    let addr1: SignerWithAddress

    this.beforeAll(async () => {
      const fixture = await deployShopFixture();
      sut = fixture.sut;
      addr1 = fixture.addr1

      await sut.setItemsRoot(validItemsRoot);
      expect(await sut.itemsRoot()).to.equal(validItemsRoot);
    });


    xdescribe('when called via payment processor', async () => {
      const proofItemPrices = [BigNumber.from(50000000000)];
      const proofItemsIds = [BigNumber.from(3)];
      const { proof, proofFlags } = makeMerkleProof(
        itemIds,
        itemPrices,
        proofItemsIds,
        proofItemPrices
      );

      this.beforeAll(async () => {
        const fixture = await deployShopFixture();
        sut = fixture.sut;
        addr1 = fixture.addr1

        await sut.setPaymentProcessor(addr1.address);
        expect(await sut.itemsRoot()).to.equal(validItemsRoot);
      });

      it('reverts when item IDs dont exist in this shop', async function () {
        // TODO
      });

      it('reverts when owner item ID is included', async function () {
        // TODO
      });

      it('mints the items', async function () {
        // TODO
      });
    });

    describe('when called directly', async () => {
      it('reverts when it is not payment processor', async () => {
        await expect(sut.buy([1], [1])).to.be.revertedWith("only processor");
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
    const erc20Addr = '0xb5f4af1a4B5021Ae10207E1C2E119ce8249B3007'
    const zeroAddr = '0x0000000000000000000000000000000000000000'

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
