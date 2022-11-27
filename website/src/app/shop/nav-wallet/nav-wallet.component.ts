import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map, pluck } from 'rxjs/operators';

import { faWallet, faShop, faCirclePlus, faSliders, faGaugeHigh, faBoxOpen } from '@fortawesome/free-solid-svg-icons';
import { ProviderService } from 'src/app/blockchain';
import { NavService } from 'src/app/core';

@Component({
  selector: 'w3s-nav-wallet',
  templateUrl: './nav-wallet.component.html',
})
export class NavWalletComponent implements OnInit {
  faWallet = faWallet;
  faShop = faShop;
  faCirclePlus = faCirclePlus;
  faSliders = faSliders;
  faGaugeHigh = faGaugeHigh;
  faBoxOpen = faBoxOpen;

  shopIdentifier$: Observable<string>;
  isAdmin$: Observable<boolean>;

  walletAddress$: Observable<string | null>;
  isWalletConnected$: Observable<boolean>;

  constructor(
    private readonly providerService: ProviderService,
    private readonly navService: NavService,
  ) {
  }

  ngOnInit(): void {
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

    this.isAdmin$ = this.navService.navInfo$.pipe(
      pluck('shop'),
      map(s => {
        if (s == null) {
          return false;
        } else {
          return s.isAdmin;
        }
      })
    );

    this.shopIdentifier$ = this.navService.navInfo$.pipe(
      map(s => s.shopIdentifier)
    );
  }

  connectWallet() {
    this.providerService.connectWallet();
  }
}