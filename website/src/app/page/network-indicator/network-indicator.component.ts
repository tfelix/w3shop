import { Component } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import { defaultIfEmpty, map, mergeMap } from 'rxjs/operators';
import { ProviderService, ShopError } from 'src/app/core';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'w3s-network-indicator',
  templateUrl: './network-indicator.component.html',
  styleUrls: ['./network-indicator.component.scss']
})
export class NetworkIndicatorComponent {

  isWrongNetwork$: Observable<boolean>;

  private targetNetworkId: number;
  targetNetwork: string;

  constructor(
    private readonly providerService: ProviderService
  ) {
    this.targetNetwork = environment.network;
    switch (environment.network) {
      case 'Arbitrum One':
        this.targetNetworkId = NetworkIndicatorComponent.ARBITRUM_ONE_CHAIN_ID;
        break;
      case 'Arbitrum Rinkeby':
        this.targetNetworkId = NetworkIndicatorComponent.ARBITRUM_RINKEBY_CHAIN_ID;
        break;
      default:
        throw new ShopError('Unknown configured network: ' + environment.network);
    }

    this.isWrongNetwork$ = this.providerService.network$.pipe(
      map(n => n.chainId !== this.targetNetworkId),
      defaultIfEmpty(false)
    )
  }

  switchNetworks() {
    this.providerService.provider$.pipe(
      mergeMap(provider => {
        if (provider == null) {
          return EMPTY;
        }

        let network: any;
        if (this.targetNetworkId === NetworkIndicatorComponent.ARBITRUM_ONE_CHAIN_ID) {
          network = NetworkIndicatorComponent.NETWORK_ARBITRUM_ONE;
        } else if (this.targetNetworkId === NetworkIndicatorComponent.ARBITRUM_RINKEBY_CHAIN_ID) {
          network = NetworkIndicatorComponent.NETWORK_ARBITRUM_RINKEBY;
        } else {
          throw new ShopError('Unknown configured network: ' + environment.network);
        }

        return provider.send('wallet_addEthereumChain', [network]);
      })
    ).subscribe()
  }

  private static readonly ARBITRUM_RINKEBY_CHAIN_ID = 421611;
  private static readonly ARBITRUM_ONE_CHAIN_ID = 42161;
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
