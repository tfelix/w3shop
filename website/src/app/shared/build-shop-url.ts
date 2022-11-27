export function buildShopUrl(shopIdentifier: string): string {
  return `https://w3shop.eth/s/${shopIdentifier}`;
}

export function buildShopItemUrl(shopIdentifier: string, tokenId: string): string {
  return buildShopUrl(shopIdentifier) + `/items/${tokenId}`;
}