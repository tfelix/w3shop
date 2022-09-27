import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment"

export interface Network {
  chainId: number;
  network: string;
  shopItemsContract: string;
  shopFactoryContract: string;
}

export const Networks: { [key: string]: Network } = {
  ARBITRUM_RINKEBY: {
    chainId: 0x66eeb,
    network: 'Arbitrum Rinkeby',
    shopItemsContract: '0x1234',
    shopFactoryContract: '1234'
  },
  ARBITRUM: {
    chainId: 0x42161,
    network: 'Arbitrum',
    shopItemsContract: '0x1234',
    shopFactoryContract: '1234'
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