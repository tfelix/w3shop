export function buildShopUrl(shopIdentifier: string): string {
  if (window && window.location) {
    const location = window.location;
    return `${location.protocol}//${location.host}/#/s/${shopIdentifier}`;
  } else {
    return `https://w3shop.eth/#/s/${shopIdentifier}`;
  }
}

export function buildShopItemUrl(shopIdentifier: string, tokenId: string): string {
  return buildShopUrl(shopIdentifier) + `/items/${tokenId}`;
}