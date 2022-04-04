
type Network = 'Arbitrum Rinkeby' |
  'Arbitrum One';

export interface Environment {
  defaultShopName: string;
  production: boolean;
  network: Network;
  injectMocks: boolean;
};