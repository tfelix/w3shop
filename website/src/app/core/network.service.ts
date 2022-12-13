import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

export interface Network {
  chainId: number;
  isDevelopment: boolean;
  network: string;
  paymentProcessors: {
    address: string;
    name: string;
  }[],
  /**
   * Contract address of the shop factory.
   */
  shopFactoryContract: string;
  walletNetwork: {
    chainId: string;
    rpcUrls: string[];
    chainName: string;
    nativeCurrency: {
      name: string;
      symbol: string;
      decimals: number;
    },
    blockExplorerUrls: string[];
  }
}

export const Networks = {
  ARBITRUM_GOERLY: {
    chainId: 421613,
    network: 'Arbitrum Goerly',
    isDevelopment: true,
    shopFactoryContract: '0x89A0027324d7F5e5837e80C238eA0A0C194FBe58',
    paymentProcessors: [{
      // No token payments
      address: '0xFd14A937D2889CF24fe84a3c0c9D6BEb285049fB',
      name: 'Alpha Processor',
    }],
    walletNetwork: {
      chainId: '0x66EED',
      rpcUrls: ['https://goerli-rollup.arbitrum.io/rpc/'],
      chainName: 'Arbitrum Goerli',
      nativeCurrency: {
        name: 'AGOR',
        symbol: 'AGOR',
        decimals: 18
      },
      blockExplorerUrls: ['https://testnet.arbiscan.io/']
    }
  },
  ARBITRUM_ONE: {
    chainId: 42161,
    network: 'Arbitrum',
    isDevelopment: false,
    shopFactoryContract: '0xf6A7028cc183b38e3c615B5Aa0731012DA09Bdd3',
    paymentProcessors: [{
      // No token payments
      address: '0x7E3e552721143977F6c0580b4Cf45d8357C65C1d',
      name: 'Alpha Processor',
    }],
    walletNetwork: {
      chainId: '0x0A4B1',
      rpcUrls: ['https://arb1.arbitrum.io/rpc'],
      chainName: 'Arbitrum One',
      nativeCurrency: {
        name: 'ETH',
        symbol: 'ETH',
        decimals: 18
      },
      blockExplorerUrls: ['https://arbiscan.io/']
    }
  }
};

@Injectable({
  providedIn: 'root'
})
export class NetworkService {

  constructor() {
    const network = this.getExpectedNetwork();
    console.log(`Expected network: ${network.network} (chain id: ${network.chainId})`);
  }

  getExpectedNetwork(): Network {
    if (environment.production) {
      return Networks.ARBITRUM_ONE;
    } else {
      return Networks.ARBITRUM_GOERLY;
    }
  }

  getChainExplorerUrl(address: string) {
    if (environment.production) {
      return Networks.ARBITRUM_ONE.walletNetwork.blockExplorerUrls + 'address/' + address;
    } else {
      return Networks.ARBITRUM_GOERLY.walletNetwork.blockExplorerUrls + 'address/' + address;
    }
  }
}