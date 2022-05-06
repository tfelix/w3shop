import { BigNumber } from "ethers";

export function buildShopUrl(shopIdentifier: string): string {
  return `https://w3shop.eth.link/${shopIdentifier}`;
}

export function buildShopItemUrl(shopIdentifier: string, tokenId: BigNumber): string {
  return buildShopUrl(shopIdentifier) + `/items/${tokenId}`;
}