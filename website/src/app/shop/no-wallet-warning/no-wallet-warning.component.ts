import { Component } from '@angular/core';
import { faFaceSadTear } from '@fortawesome/free-solid-svg-icons';
import { ProviderService } from 'src/app/core';

@Component({
  selector: 'w3s-no-wallet-warning',
  templateUrl: './no-wallet-warning.component.html',
})
export class NoWalletWarningComponent {

  faFaceSadTear = faFaceSadTear;

  isWalletConnected$ = this.providerService.isWalletConnected$;

  constructor(
    private readonly providerService: ProviderService
  ) {
  }

  connectWallet() {
    this.providerService.connectWallet();
  }
}
