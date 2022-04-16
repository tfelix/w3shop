import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ChainIds, ProviderService } from 'src/app/core';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'w3s-network-indicator',
  templateUrl: './network-indicator.component.html',
  styleUrls: ['./network-indicator.component.scss']
})
export class NetworkIndicatorComponent {

  isWrongNetwork$: Observable<boolean> = this.providerService.chainId$.pipe(
    map(n => n !== this.targetNetworkId)
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
    this.providerService.switchNetworkToSelected();
  }
}
