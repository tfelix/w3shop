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
}

export const Networks: { [key: string]: Network } = {
  ARBITRUM_RINKEBY: {
    chainId: 0x66eeb,
    network: 'Arbitrum Rinkeby',
    shopItemsContract: '0x0',
    shopFactoryContract: '0x47C83b28F6228c8aA4C7D3705389b1C11874428B',
  },
  ARBITRUM_GOERLY: {
    chainId: 421613,
    network: 'Arbitrum Goerly',
    shopItemsContract: '0x0',
    shopFactoryContract: '0x0'
  },
  ARBITRUM_ONE: {
    chainId: 0x42161,
    network: 'Arbitrum',
    shopItemsContract: '0x0',
    shopFactoryContract: '0x0'
  }
}

@Injectable({
  providedIn: 'root'
})
export class NetworkService {

  getExpectedNetwork(): Network {
    if (environment.production) {
      return Networks.ARBITRUM;
    } else {
      return Networks.ARBITRUM_RINKEBY;
    }
  }
}