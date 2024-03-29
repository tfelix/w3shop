import { Component } from '@angular/core';
import { faNetworkWired } from '@fortawesome/free-solid-svg-icons';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NetworkService } from 'src/app/core';

import { ProviderService } from '../provider.service';

@Component({
  selector: 'w3s-network-indicator',
  templateUrl: './network-indicator.component.html',
  styleUrls: ['./network-indicator.component.scss']
})
export class NetworkIndicatorComponent {

  faWrongNetwork = faNetworkWired;

  isWrongNetwork$: Observable<boolean> = combineLatest([
    this.providerService.isWalletConnected$,
    this.providerService.chainId$
  ]).pipe(
    map(([isWalletConnected, chainId]) => {
      return isWalletConnected && chainId !== this.targetNetworkId;
    })
  );

  private targetNetworkId: number;
  targetNetwork: string;

  constructor(
    private readonly providerService: ProviderService,
    private readonly networkService: NetworkService
  ) {
    const network = this.networkService.getExpectedNetwork();
    this.targetNetworkId = network.chainId;
    this.targetNetwork = network.network;
  }

  switchNetworks() {
    this.providerService.switchNetworkToSelected();
  }
}
