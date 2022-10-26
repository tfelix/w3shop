import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { map, pluck, tap } from 'rxjs/operators';

import { faWallet, faShop, faCirclePlus, faSliders, faGaugeHigh, faBoxOpen } from '@fortawesome/free-solid-svg-icons';
import { NavService, ProviderService } from 'src/app/core';

@Component({
  selector: 'w3s-nav-wallet',
  templateUrl: './nav-wallet.component.html',
})
export class NavWalletComponent {
  faWallet = faWallet;
  faShop = faShop;
  faCirclePlus = faCirclePlus;
  faSliders = faSliders;
  faGaugeHigh = faGaugeHigh;
  faBoxOpen = faBoxOpen;

  shopIdentifier: string | null;

  readonly isAdmin$: Observable<boolean>;

  readonly walletAddress$: Observable<string | null>;
  readonly isWalletConnected$: Observable<boolean>;

  constructor(
    private readonly providerService: ProviderService
  ) {
    this.walletAddress$ = this.providerService.address$.pipe(
      map(addr => {
        if (addr == null) {
          return null;
        } else {
          return addr.slice(0, 6) + '…' + addr.slice(38);
        }
      })
    );

    this.isWalletConnected$ = this.providerService.isWalletConnected$;
  }

  connectWallet() {
    this.providerService.connectWallet();
  }
}