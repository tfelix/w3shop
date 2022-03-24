
type Network = 'rinkeby';
type CeramicApi = 'https://gateway-clay.ceramic.network';
type DatabaseServiceInject = 'mock';
type BlockchainServiceInject = 'mock';
type CeramicAuthenticatorInject = 'key' | 'nft';

export interface Environment {
  defaultShopName: string;
  production: boolean;
  network: Network;
  ceramicApi: CeramicApi;
  injectedDatabaseService: DatabaseServiceInject;
  injectedBlockchainService: BlockchainServiceInject;
  injectedCeramicAuthenticator: CeramicAuthenticatorInject;
};