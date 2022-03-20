import { Environment } from "./environment-model";

export const environment: Environment = {
  defaultShopName: 'w3shop',
  production: true,
  network: 'rinkeby',
  ceramicApi: "https://gateway-clay.ceramic.network",
  injectedDatabaseService: "mock",
  injectedBlockchainService: "mock",
  injectedCeramicAuthenticator: "key"
};