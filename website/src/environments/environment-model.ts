
type Network = 'rinkeby';
type CeramicApi = 'https://gateway-clay.ceramic.network';
type SmartContractFacadeInject = 'mock';
type BlockchainServiceInject = 'mock';
type CeramicAuthenticatorInject = 'key' | 'nft';

export interface Environment {
  defaultShopName: string;
  production: boolean;
  network: Network;
  ceramicApi: CeramicApi;
  injectedSmartContractFacade: SmartContractFacadeInject;
  injectedBlockchainService: BlockchainServiceInject;
  injectedCeramicAuthenticator: CeramicAuthenticatorInject;
};