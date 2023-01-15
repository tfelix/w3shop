import { expect } from 'chai';
import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';
import { W3Shop } from '../typechain-types';
import { deployMockTokens, deployShopFixture } from './fixture';
import { makeMerkleProof } from './proof-helper';

function getBuyParams(
  shop: W3Shop,
  allShopItems: BigNumber[],
  allExistingPrices: BigNumber[]
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

async function deployShopFixtureWithToken() {
  const mockTokens = await deployMockTokens();
  const fixture = await deployShopFixture();

  await fixture.shop.setPaymentReceiver(fixture.addr1.address);

  return { ...fixture, ...mockTokens, receiverAddr: fixture.addr1 };
}

describe('W3PaymentProcessorV2', async () => {

  describe('buy with ERC777 token', async () => {

    it('reverts if the token is not the accepted currency', async () => {

    });

    it('reverts when amount is incorrect', async () => {

    });

    it('reverts when proof is incorrect', async () => {

    });

    /*
    it('buys the requested item', async () => {
      const {
        shop, paymentProcessor, existingItemIds, existingItemPrices, mockTokenERC777
      } = await deployShopFixtureWithToken();

      await shop.setAcceptedCurrency(mockTokenERC777.address);

      const params = getBuyParams(shop, existingItemIds, existingItemPrices);

      mockTokenERC777.send();
    });*/
  });

  describe('#buyWithEther', async () => {
    it('reverts if shops base currency is not ETH', async () => {
      const {
        shop, paymentProcessor, existingItemIds, existingItemPrices, mockTokenERC20
      } = await deployShopFixtureWithToken();

      await shop.setAcceptedCurrency(mockTokenERC20.address);

      const params = getBuyParams(shop, existingItemIds, existingItemPrices);

      await expect(
        paymentProcessor.buyWithEther(params, { value: existingItemPrices[0] })
      ).to.be.revertedWith("currency not accepted");
    });

    it('reverts if ETH amount is not enough', async () => {
      const { shop, paymentProcessor, existingItemIds, existingItemPrices } = await deployShopFixtureWithToken();
      const params = getBuyParams(shop, existingItemIds, existingItemPrices);

      await expect(
        paymentProcessor.buyWithEther(params, { value: 2000000000 })
      ).to.be.revertedWith("invalid amount");
    });

    it('reverts if proof is invalid', async () => {
      const { shop, paymentProcessor, existingItemIds, existingItemPrices } = await deployShopFixtureWithToken();

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
      const {
        shop, owner, paymentProcessor, existingItemIds, existingItemPrices
      } = await deployShopFixtureWithToken();

      const params = getBuyParams(shop, existingItemIds, existingItemPrices);
      const price = existingItemPrices[0];

      await paymentProcessor.buyWithEther(params, { value: price });

      expect(await shop.balanceOf(owner.address, existingItemIds[0])).to.equal(1);
    });
  });

  describe('#buyWithToken', async () => {

    it('reverts if shops base currency is not token', async () => {
      const {
        shop, paymentProcessor, existingItemIds, existingItemPrices, mockTokenERC20
      } = await deployShopFixtureWithToken();

      await shop.setAcceptedCurrency(ethers.constants.AddressZero);

      const params = getBuyParams(shop, existingItemIds, existingItemPrices);

      await expect(
        paymentProcessor.buyWithToken(mockTokenERC20.address, params)
      ).to.be.revertedWith("currency not accepted");
    });

    it('reverts because its not supported', async () => {
      const {
        shop, paymentProcessor, existingItemIds, existingItemPrices, mockTokenERC20
      } = await deployShopFixtureWithToken();

      await shop.setAcceptedCurrency(mockTokenERC20.address);

      const params = getBuyParams(
        shop,
        [...existingItemIds, BigNumber.from(69)],
        [...existingItemPrices, BigNumber.from(10000)]
      );

      await expect(
        paymentProcessor.buyWithToken(mockTokenERC20.address, params)
      ).to.be.revertedWith("invalid proof");
    });

    describe('when called with ERC20 token', async () => {

      it('buys the requested items', async () => {
        const {
          shop, owner, paymentProcessor,
          existingItemIds, existingItemPrices, receiverAddr,
          mockTokenERC20
        } = await deployShopFixtureWithToken();

        await shop.setAcceptedCurrency(mockTokenERC20.address);

        const params = getBuyParams(shop, existingItemIds, existingItemPrices);
        const price = existingItemPrices[0];

        // Set allowance of token
        mockTokenERC20.approve(paymentProcessor.address, price);

        const previousBalance = await mockTokenERC20.balanceOf(receiverAddr.address);
        await paymentProcessor.buyWithToken(mockTokenERC20.address, params);
        const dBalance = (await mockTokenERC20.balanceOf(receiverAddr.address)).sub(previousBalance);

        expect(await shop.balanceOf(owner.address, existingItemIds[0])).to.equal(1);
        expect(dBalance).to.equal(price);
      });
    });
  });
});
