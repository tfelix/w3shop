import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { map, pluck } from 'rxjs/operators';

import { faWallet, faShop, faCirclePlus, faSliders, faGaugeHigh, faBoxOpen } from '@fortawesome/free-solid-svg-icons';

import { ProviderService, ShopInfo, ShopInfoService } from 'src/app/core';

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

  readonly shopInfo$: Observable<ShopInfo>;
  readonly isShopResolved$: Observable<boolean>;
  readonly homeLink$: Observable<string>;
  readonly aboutLink$: Observable<string>;

  shopIdentifier: string;

  readonly isAdmin$: Observable<boolean>;
  readonly walletAddress$: Observable<string>;

  // The cart is only displayed if we are connected and a shop is resolved.
  readonly isWalletConnected$: Observable<boolean>;

  constructor(
    private readonly shopInfoService: ShopInfoService,
    private readonly providerService: ProviderService,
  ) {
    this.shopInfo$ = this.shopInfoService.shopInfo$;
    this.isShopResolved$ = this.shopInfoService.shopInfo$.pipe(pluck('isResolved'));

    this.homeLink$ = this.shopInfo$.pipe(
      map(x => `s/${x.shopIdentifier}`)
    );

    this.shopInfo$.pipe(
      // The routerLink binding seems to fail to work with observables in general so we fill up a
      // string variable and use that instead to build the route.
      pluck('shopIdentifier'),
    ).subscribe(s => this.shopIdentifier = s);

    this.isAdmin$ = this.shopInfo$.pipe(
      map(x => x.isAdmin),
    );

    this.isWalletConnected$ = this.providerService.isWalletConnected$;
    this.walletAddress$ = this.providerService.address$.pipe(
      map(x => x.slice(0, 6) + '…' + x.slice(38))
    );
  }

  connectWallet() {
    this.providerService.connectWallet();
  }
}
