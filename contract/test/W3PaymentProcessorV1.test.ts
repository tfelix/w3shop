import { expect } from 'chai';
import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';
import {
  W3Shop
} from '../typechain';
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

async function deployShopFixtureWithVault() {
  const { mockTokenERC20 } = await deployMockTokens();
  const fixture = await deployShopFixture();
  await fixture.shop.setVault(fixture.vault.address, fixture.owner.address);

  return { ...fixture, mockTokenERC20 };
}

describe('W3PaymentProcessorV1', async () => {

  describe('#buyWithEther', async () => {
    it('reverts if shops base currency is not ETH', async () => {
      const {
        vault, owner, shop, paymentProcessor, existingItemIds, existingItemPrices, mockTokenERC20
      } = await deployShopFixtureWithVault();

      const curTx = await vault.setAcceptedCurrency(owner.address, mockTokenERC20.address);
      await curTx.wait();

      const params = getBuyParams(shop, existingItemIds, existingItemPrices);

      await expect(
        paymentProcessor.buyWithEther(params, { value: existingItemPrices[0] })
      ).to.be.revertedWith("eth not accepted");
    });

    it('reverts if ETH amount is not enough', async () => {
      const { shop, paymentProcessor, existingItemIds, existingItemPrices } = await deployShopFixtureWithVault();
      const params = getBuyParams(shop, existingItemIds, existingItemPrices);

      await expect(
        paymentProcessor.buyWithEther(params, { value: 2000000000 })
      ).to.be.revertedWith("invalid amount");
    });

    it('reverts if proof is invalid', async () => {
      const { shop, paymentProcessor, existingItemIds, existingItemPrices } = await deployShopFixtureWithVault();

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
        shop, owner, shopItems, paymentProcessor, existingItemIds, existingItemPrices, vault
      } = await deployShopFixtureWithVault();

      const params = getBuyParams(shop, existingItemIds, existingItemPrices);
      const tx = await paymentProcessor.buyWithEther(params, { value: existingItemPrices[0] });
      await tx.wait();

      expect(await shopItems.balanceOf(owner.address, existingItemIds[0])).to.equal(1);
      expect(await ethers.getDefaultProvider().getBalance(vault.address)).to.equal(existingItemPrices[0]);
    });
  });

  xdescribe('#buyWithToken', async () => {
    it('reverts if shops base currency is not token', async () => {

    });

    it('reverts if token amount is not enought', async () => {

    });

    it('reverts if proof is invalid', async () => {

    });

    it('buys the requested items', async () => {

    });
  });
});
