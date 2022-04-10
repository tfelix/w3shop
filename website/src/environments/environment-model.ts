export interface Environment {
  defaultShopName: string;

  /**
   * When set to 'false' it will point against Arbitrum Rinkeby.
   */
  production: boolean;

  /**
   * Should be true for local testing, as this will prevent most calls against the
   * actual blockchain and only fake contract deployments.
   */
  injectMocks: boolean;

  /**
   * Contract address of the shop factory.
   */
  shopFactoryAddr: string;

  /**
   * The NFT Arweave owner ID. Its onle the ID part of the URL:
   * Given the URL https://arweave.net/V3wuc162d70sqxH55qaL8xFMWvDhASGPy7c4XVA3Vqg then the
   * V3wuc162d70sqxH55qaL8xFMWvDhASGPy7c4XVA3Vqg part would be the ID.
   */
  ownerNftArweaveId: string;
};