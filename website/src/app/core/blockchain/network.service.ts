import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment"

export interface Network {
  chainId: number;
  network: string;
  shopItemsContract: string;
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
    shopItemsContract: '0x0',
    shopFactoryContract: '0x0',
    walletNetwork: {
      chainId: "0x66EED",
      rpcUrls: ["https://goerli-rollup.arbitrum.io/rpc/"],
      chainName: "Arbitrum Goerli",
      nativeCurrency: {
        name: "AGOR",
        symbol: "AGOR",
        decimals: 18
      },
      blockExplorerUrls: ["https://goerli-rollup-explorer.arbitrum.io"]
    }
  },
  ARBITRUM_ONE: {
    chainId: 42161,
    network: 'Arbitrum',
    shopItemsContract: '0x0',
    shopFactoryContract: '0x0',
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
      return Networks.ARBITRUM;
    } else {
      return Networks.ARBITRUM_GOERLY;
    }
  }
}