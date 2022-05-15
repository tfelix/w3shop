import { Component } from '@angular/core';
import { faWallet } from '@fortawesome/free-solid-svg-icons';
import { ProviderService } from 'src/app/core';

@Component({
  selector: 'w3s-no-wallet',
  templateUrl: './no-wallet.component.html',
  styleUrls: ['./no-wallet.component.scss']
})
export class NoWalletComponent {

  constructor(
    private readonly providerService: ProviderService
  ) {

  }

  connectWallet() {
    this.providerService.connectWallet();
  }
}
