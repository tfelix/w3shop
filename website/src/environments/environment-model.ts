export interface Environment {
  defaultShopName: string;

  /**
   * When set to 'false' it will point against Arbitrum Rinkeby.
   */
  production: boolean;

  /**
   * Code hash of the W3Shop for the creation of CREATE2 addresses. By packing the
   * code hash we dont need the contract bytecode. It is calculated like this:
   *
   * const bytecode = W3Shop.bytecode;
   * const encoded = encode(["address", "address"], [ paymentProcessorAddress, shopItemsAddress ]);
   * const initCode = bytecode + encoded;
   * const initCodeHash = ethers.utils.keccak256(initCode);
   */
  initCodeHashW3Shop: string,

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