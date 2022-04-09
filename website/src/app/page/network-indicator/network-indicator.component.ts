import { Component } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import { defaultIfEmpty, map, mergeMap } from 'rxjs/operators';
import { ChainIds, ProviderService, ShopError } from 'src/app/core';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'w3s-network-indicator',
  templateUrl: './network-indicator.component.html',
  styleUrls: ['./network-indicator.component.scss']
})
export class NetworkIndicatorComponent {

  isWrongNetwork$: Observable<boolean> = this.providerService.chainId$.pipe(
    map(n => n !== this.targetNetworkId),
    defaultIfEmpty(false),
  );

  private targetNetworkId: number;
  targetNetwork: string;

  constructor(
    private readonly providerService: ProviderService
  ) {
    if (environment.production) {
      this.targetNetwork = 'Arbitrum One';
      this.targetNetworkId = ChainIds.ARBITRUM;
    } else {
      this.targetNetwork = 'Arbitrum Rinkeby';
      this.targetNetworkId = ChainIds.ARBITRUM_RINKEBY;
    }
  }

  switchNetworks() {
    this.providerService.provider$.pipe(
      mergeMap(provider => {
        if (provider == null) {
          return EMPTY;
        }

        let network: any;

        if (this.targetNetworkId === ChainIds.ARBITRUM) {
          network = NetworkIndicatorComponent.NETWORK_ARBITRUM_ONE;
        } else if (this.targetNetworkId === ChainIds.ARBITRUM_RINKEBY) {
          network = NetworkIndicatorComponent.NETWORK_ARBITRUM_RINKEBY;
        } else {
          throw new ShopError('Unknown configured network.');
        }

        return provider.send('wallet_addEthereumChain', [network]);
      })
    ).subscribe()
  }

  private static readonly NETWORK_ARBITRUM_RINKEBY = {
    chainId: "0x66eeb",
    rpcUrls: ["https://rinkeby.arbitrum.io/rpc"],
    chainName: "Arbitrum Testnet",
    nativeCurrency: {
      name: "ETH",
      symbol: "ETH",
      decimals: 18
    },
    blockExplorerUrls: ["https://testnet.arbiscan.io/"]
  };

  private static readonly NETWORK_ARBITRUM_ONE = {
    chainId: "0x42161",
    rpcUrls: ["https://arb1.arbitrum.io/rpc"],
    chainName: "Arbitrum One",
    nativeCurrency: {
      name: "ETH",
      symbol: "ETH",
      decimals: 18
    },
    blockExplorerUrls: ["https://arbiscan.io/"]
  };
}
