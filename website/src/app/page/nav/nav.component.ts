import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { map, pluck, tap } from 'rxjs/operators';

import { faWallet, faShop, faCirclePlus, faSliders, faGaugeHigh, faBoxOpen } from '@fortawesome/free-solid-svg-icons';
import { NavService } from 'src/app/core';

@Component({
  selector: 'w3s-nav',
  templateUrl: './nav.component.html',
})
export class NavComponent {
  faWallet = faWallet;
  faShop = faShop;
  faCirclePlus = faCirclePlus;
  faSliders = faSliders;
  faGaugeHigh = faGaugeHigh;
  faBoxOpen = faBoxOpen;

  // readonly shopInfo$: Observable<ShopInfo>;
  readonly isShopResolved$: Observable<boolean>;
  readonly homeLink$: Observable<string>;
  readonly aboutLink$: Observable<string>;
  readonly shopName$: Observable<string>;

  // We need this as non observable, otherwise the routing component often
  // messes up the link.
  shopIdentifier: string;

  readonly isAdmin$: Observable<boolean>;
  readonly walletAddress$: Observable<string>;

  // The cart is only displayed if we are connected and a shop is resolved.
  readonly isWalletConnected$: Observable<boolean>;

  constructor(
    private readonly navService: NavService
  ) {
    this.isShopResolved$ = this.navService.navInfo$.pipe(pluck('isShopResolved'));
    this.shopName$ = this.navService.navInfo$.pipe(pluck('shopName'));
    this.homeLink$ = this.navService.navInfo$.pipe(
      tap(x => {
        this.shopIdentifier = x.shopIdentifier;
      }),
      map(x => `s/${x.shopIdentifier}`)
    );

    this.isAdmin$ = this.navService.navInfo$.pipe(pluck('isAdmin'));
    this.isWalletConnected$ = this.navService.navInfo$.pipe(map(x => x.wallet !== null));
    this.walletAddress$ = this.navService.navInfo$.pipe(
      map(x => x.wallet),
      map(x => {
        if (x == null) {
          return '';
        } else {
          return x.connectedAddress.slice(0, 6) + '…' + x.connectedAddress.slice(38);
        }
      })
    );
  }

  connectWallet() {
    alert('Not implemented');
    // how to connect this to the shop service?
    // this.providerService.connectWallet();
  }
}
