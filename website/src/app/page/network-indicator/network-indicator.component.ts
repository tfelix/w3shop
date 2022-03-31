import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { defaultIfEmpty, map } from 'rxjs/operators';
import { ProviderService, WalletService } from 'src/app/core';

@Component({
  selector: 'w3s-network-indicator',
  templateUrl: './network-indicator.component.html',
  styleUrls: ['./network-indicator.component.scss']
})
export class NetworkIndicatorComponent {

  isWrongNetwork$: Observable<boolean>;

  constructor(
    private readonly providerService: ProviderService
  ) {
    this.isWrongNetwork$ = this.providerService.network$.pipe(
      map(n => n.chainId !== NetworkIndicatorComponent.RINKEBY_CHAIN_ID),
      defaultIfEmpty(false)
    )
  }

  switchNetworks() {
    this.providerService.provider$.subscribe(provider => {
      if (provider == null) {
        return;
      }

      provider.send('wallet_addEthereumChain', [
        {
          chainId: "0x04",
          rpcUrls: [""],
          chainName: "Rinkeby",
          nativeCurrency: {
            name: "ETH",
            symbol: "ETH",
            decimals: 18
          },
          blockExplorerUrls: ["https://rinkeby.etherscan.io"]
        }
      ])
    });
  }

  private static readonly RINKEBY_CHAIN_ID = 4;
}
