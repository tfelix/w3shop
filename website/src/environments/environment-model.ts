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
   * The NFT Arweave owner URI. It must start with ar:// if its Arweave.
   * Given the URL ID V3wuc162d70sqxH55qaL8xFMWvDhASGPy7c4XVA3Vqg then the URI is
   * ar://V3wuc162d70sqxH55qaL8xFMWvDhASGPy7c4XVA3Vqg part would be the ID.
   */
  ownerNftArweaveUri: string;
};