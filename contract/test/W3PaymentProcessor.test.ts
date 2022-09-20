import { expect } from 'chai';
import { ethers } from 'ethers';
import {
  W3Shop
} from '../typechain';
import { deployShopFixture } from './fixture';
import { makeMerkleProof, makeMerkleRoot, toBigNumbers } from './proof-helper';

const itemIdsNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const itemPricesNumbers = [
  12000000000, 30000000000, 51200000000, 1005600000, 100078200000, 10000000000,
  10000000000, 10000000000, 30000000000, 45600000000,
];

const itemIds = toBigNumbers(itemIdsNumbers);
const itemPrices = toBigNumbers(itemPricesNumbers);

const validItemsRoot = makeMerkleRoot(itemIds, itemPrices);

function getBuyParams(shop: W3Shop) {
  const { proof, proofFlags } = makeMerkleProof(
    itemIds,
    itemPrices,
    [itemIds[0]],
    [itemPrices[0]]
  );

  return {
    shop: shop.address,
    amounts: [1],
    prices: [itemPrices[0]],
    itemIds: [itemIds[0]],
    proofs: proof,
    proofFlags: proofFlags
  };
}

describe('W3PaymentProcessor', async () => {

  describe('#buyWithEther', async () => {
    it('reverts if shops base currency is not ETH', async () => {
      const { shop, owner, mockToken, paymentProcessor } = await deployShopFixture();

      const curTx = await shop.setAcceptedCurrency(owner.address, mockToken.address);
      await curTx.wait();

      const rootTx = await shop.setItemsRoot(validItemsRoot);
      await rootTx.wait();

      expect(await shop.itemsRoot()).to.equal(validItemsRoot);

      const params = getBuyParams(shop);

      await expect(
        paymentProcessor.buyWithEther(params, { value: 42000000000 })
      ).to.be.revertedWith("ether not accepted");
    });

    it('reverts if ETH amount is not enought', async () => {
      const { paymentProcessor, shop, owner } = await deployShopFixture();

      const curTx = await shop.setAcceptedCurrency(owner.address, ethers.constants.AddressZero);
      await curTx.wait();

      const rootTx = await shop.setItemsRoot(validItemsRoot);
      await rootTx.wait();

      expect(await shop.itemsRoot()).to.equal(validItemsRoot);

      const params = getBuyParams(shop);

      await expect(
        paymentProcessor.buyWithEther(params, { value: 2000000000 })
      ).to.be.revertedWith("invalid amount");
    });

    it('reverts if proof is invalid', async () => {
      const { paymentProcessor, shop, owner } = await deployShopFixture();

      const curTx = await shop.setAcceptedCurrency(owner.address, ethers.constants.AddressZero);
      await curTx.wait();

      const params = getBuyParams(shop);

      await expect(
        paymentProcessor.buyWithEther(params, { value: 42000000000 })
      ).to.be.revertedWith("invalid proof");
    });

    xit('buys the requested items', async () => {
      const { paymentProcessor, shop, shopItems, owner } = await deployShopFixture();
      await shop.setAcceptedCurrency(owner.address, ethers.constants.AddressZero);

      const params = getBuyParams(shop);
      const tx = await paymentProcessor.buyWithEther(params, { value: 42000000000 });
      await tx.wait();

      expect(await shopItems.balanceOf(owner.address, 1)).to.equal(1);
      expect(await shopItems.balanceOf(owner.address, 2)).to.equal(1);
    });
  });

  xdescribe('#buyWithSameToken', async () => {
    it('reverts if shops base currency is not token', async () => {

    });

    it('reverts if token amount is not enought', async () => {

    });

    it('reverts if proof is invalid', async () => {

    });

    it('buys the requested items', async () => {

    });
  });

  // Token exchange is currently not supported.
  xdescribe('#buyWithToken', async () => {
    it('reverts if shops base currency is same token', async () => {

    });

    it('reverts if token amount is not enought', async () => {

    });

    it('reverts if proof is invalid', async () => {

    });

    it('buys the requested items', async () => {

    });
  });
});
