
type Network = 'rinkeby';

export interface Environment {
  defaultShopName: string;
  production: boolean;
  network: Network;
  injectMocks: boolean;
};