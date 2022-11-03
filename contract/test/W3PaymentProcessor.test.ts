import { expect } from 'chai';
import { BigNumber, ethers } from 'ethers';
import {
  W3Shop
} from '../typechain';
import { deployMockTokens, deployShopFixture } from './fixture';
import { makeMerkleProof } from './proof-helper';

function getBuyParams(
  shop: W3Shop,
  allShopItems: ethers.BigNumber[],
  allExistingPrices: ethers.BigNumber[]
) {

  const { proof, proofFlags } = makeMerkleProof(
    allShopItems,
    allExistingPrices,
    [allShopItems[0]],
    [allExistingPrices[0]]
  );

  return {
    shop: shop.address,
    amounts: [1],
    prices: [allExistingPrices[0]],
    itemIds: [allShopItems[0]],
    proofs: proof,
    proofFlags: proofFlags
  };
}

describe('W3PaymentProcessor', async () => {

  describe('#buyWithEther', async () => {
    it('reverts if shops base currency is not ETH', async () => {
      const { shop, owner, paymentProcessor, existingItemIds, existingItemPrices } = await deployShopFixture();
      const { mockTokenERC20 } = await deployMockTokens();

      const curTx = await shop.setAcceptedCurrency(owner.address, mockTokenERC20.address);
      await curTx.wait();

      const params = getBuyParams(shop, existingItemIds, existingItemPrices);

      await expect(
        paymentProcessor.buyWithEther(params, { value: existingItemPrices[0] })
      ).to.be.revertedWith("ether not accepted");
    });

    it('reverts if ETH amount is not enought', async () => {
      const { shop, owner, paymentProcessor, existingItemIds, existingItemPrices } = await deployShopFixture();

      const curTx = await shop.setAcceptedCurrency(owner.address, ethers.constants.AddressZero);
      await curTx.wait();

      const params = getBuyParams(shop, existingItemIds, existingItemPrices);

      await expect(
        paymentProcessor.buyWithEther(params, { value: 2000000000 })
      ).to.be.revertedWith("invalid amount");
    });

    it('reverts if proof is invalid', async () => {
      const { shop, owner, paymentProcessor, existingItemIds, existingItemPrices } = await deployShopFixture();

      const curTx = await shop.setAcceptedCurrency(owner.address, ethers.constants.AddressZero);
      await curTx.wait();

      const params = getBuyParams(
        shop,
        [...existingItemIds, BigNumber.from(69)],
        [...existingItemPrices, BigNumber.from(10000)]
      );

      await expect(
        paymentProcessor.buyWithEther(params, { value: existingItemPrices[0] })
      ).to.be.revertedWith("invalid proof");
    });

    it('buys the requested items', async () => {
      const { shop, owner, paymentProcessor, shopItems, existingItemIds, existingItemPrices } = await deployShopFixture();
      await shop.setAcceptedCurrency(owner.address, ethers.constants.AddressZero);

      const params = getBuyParams(shop, existingItemIds, existingItemPrices);
      const tx = await paymentProcessor.buyWithEther(params, { value: existingItemPrices[0] });
      await tx.wait();

      expect(await shopItems.balanceOf(owner.address, existingItemIds[0])).to.equal(1);
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
