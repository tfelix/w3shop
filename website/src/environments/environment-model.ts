export interface Environment {
  defaultShopName: string;

  /**
   * When set to 'false' it will point against Arbitrum Rinkeby.
   */
  production: boolean;

  /**
   * The NFT Arweave owner ID. Its onle the ID part of the URL:
   * Given the URL https://arweave.net/V3wuc162d70sqxH55qaL8xFMWvDhASGPy7c4XVA3Vqg then the
   * V3wuc162d70sqxH55qaL8xFMWvDhASGPy7c4XVA3Vqg part would be the ID.
   */
  ownerNftArweaveId: string;

  mockFileUpload: boolean;

  /**
   * Controls if a file should be envrypted via Lit or only mocked.
   * Can be used for local testing that should not actually run against
   * Lit.
   */
  mockPayloadEncryption: boolean;
};