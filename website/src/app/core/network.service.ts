import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment"

export interface Network {
  chainId: number;
  isDevelopment: boolean;
  network: string;
  shopItemsContract: string;
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

export const Networks: { [key: string]: Network } = {
  ARBITRUM_GOERLY: {
    chainId: 421613,
    network: 'Arbitrum Goerly',
    isDevelopment: true,
    shopItemsContract: '0x0',
    shopFactoryContract: '0x88BF1595e9A10a36f1a8daE2366B1B7cfE25b1a8',
    paymentProcessors: [{
      // No token payments
      address: '0xBF7f84CA693EAc8Afcf0d93c8Bc5FFE7e049728b',
      name: 'Alpha Processor',
    }],
    walletNetwork: {
      chainId: "0x66EED",
      rpcUrls: ["https://goerli-rollup.arbitrum.io/rpc/"],
      chainName: "Arbitrum Goerli",
      nativeCurrency: {
        name: "AGOR",
        symbol: "AGOR",
        decimals: 18
      },
      blockExplorerUrls: ["https://goerli-rollup-explorer.arbitrum.io/"]
    }
  },
  ARBITRUM_ONE: {
    chainId: 42161,
    network: 'Arbitrum',
    isDevelopment: false,
    shopItemsContract: '0x1123249d091e92fc375fee68e03202a33ffdba6e',
    shopFactoryContract: '0x260B13D233FDE4ee9929d6E751c4d82C30AD2d67',
    paymentProcessors: [{
      // No token payments
      address: '0xdf457d319AB510A336EAf5c2a0716877dCAce585',
      name: 'Alpha Processor',
    }],
    walletNetwork: {
      chainId: "0x0A4B1",
      rpcUrls: ["https://arb1.arbitrum.io/rpc"],
      chainName: "Arbitrum One",
      nativeCurrency: {
        name: "ETH",
        symbol: "ETH",
        decimals: 18
      },
      blockExplorerUrls: ["https://arbiscan.io/"]
    }
  }
}

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