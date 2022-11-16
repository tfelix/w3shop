import { expect } from 'chai';
import { ethers } from 'hardhat';
import { BigNumber } from 'ethers';
import {
  W3Shop,
  W3ShopVaultV1
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

async function setAcceptedCurrency(shop: W3Shop, receiver: string, tokenAddress: string) {
  const vaultAddr = await shop.getVault();
  const vault = await ethers.getContractAt('W3ShopVaultV1', vaultAddr) as W3ShopVaultV1;
  const curTx = await vault.setAcceptedCurrency(receiver, tokenAddress);
  await curTx.wait();
}

describe('W3PaymentProcessorV1', async () => {

  describe('#buyWithEther', async () => {
    it('reverts if shops base currency is not ETH', async () => {
      const { shop, owner, paymentProcessor, existingItemIds, existingItemPrices } = await deployShopFixture();
      const { mockTokenERC20 } = await deployMockTokens();

      await setAcceptedCurrency(shop, owner.address, mockTokenERC20.address);

      const params = getBuyParams(shop, existingItemIds, existingItemPrices);

      await expect(
        paymentProcessor.buyWithEther(params, { value: existingItemPrices[0] })
      ).to.be.revertedWith("ether not accepted");
    });

    it('reverts if ETH amount is not enought', async () => {
      const { shop, owner, paymentProcessor, existingItemIds, existingItemPrices } = await deployShopFixture();

      await setAcceptedCurrency(shop, owner.address, ethers.constants.AddressZero);

      const params = getBuyParams(shop, existingItemIds, existingItemPrices);

      await expect(
        paymentProcessor.buyWithEther(params, { value: 2000000000 })
      ).to.be.revertedWith("invalid amount");
    });

    it('reverts if proof is invalid', async () => {
      const { shop, owner, paymentProcessor, existingItemIds, existingItemPrices } = await deployShopFixture();

      await setAcceptedCurrency(shop, owner.address, ethers.constants.AddressZero);

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
      await setAcceptedCurrency(shop, owner.address, ethers.constants.AddressZero);

      const params = getBuyParams(shop, existingItemIds, existingItemPrices);
      const tx = await paymentProcessor.buyWithEther(params, { value: existingItemPrices[0] });
      await tx.wait();

      expect(await shopItems.balanceOf(owner.address, existingItemIds[0])).to.equal(1);
      expect(await shop.provider.getBalance(shop.address)).to.equal(existingItemPrices[0]);
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
