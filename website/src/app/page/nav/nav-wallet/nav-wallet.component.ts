import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { faWallet, faShop, faCirclePlus, faSliders, faGaugeHigh, faBoxOpen } from '@fortawesome/free-solid-svg-icons';
import { ProviderService } from 'src/app/blockchain';
import { ShopAdminService } from 'src/app/shop/shop-admin.service';

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

  shopIdentifier: string | null;

  isAdmin$: Observable<boolean>;

  walletAddress$: Observable<string | null>;
  isWalletConnected$: Observable<boolean>;

  constructor(
    private readonly providerService: ProviderService,
    private readonly shopAdminService: ShopAdminService,
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
    this.isAdmin$ = this.shopAdminService.isAdmin$;
  }

  connectWallet() {
    this.providerService.connectWallet();
  }
}