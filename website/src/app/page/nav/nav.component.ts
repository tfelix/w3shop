import { Component } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { faWallet, faShop, faCirclePlus, faSliders } from '@fortawesome/free-solid-svg-icons';

import { ProviderService, ShopFacadeFactory } from 'src/app/core';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'w3s-nav',
  templateUrl: './nav.component.html',
})
export class NavComponent {
  faWallet = faWallet;
  faShop = faShop;
  faCirclePlus = faCirclePlus;
  faSliders = faSliders;

  readonly homeLink$: Observable<string>;
  readonly shopName$: Observable<string>;
  readonly description$: Observable<string>;
  readonly isShopResolved$: Observable<boolean>;
  readonly shopIdentifier$: Observable<string>;

  readonly isAdmin$: Observable<boolean>;
  readonly walletAddress$: Observable<string>;

  // The cart is only displayed if we are connected and a shop is resolved.
  readonly isWalletConnected$: Observable<boolean>;

  constructor(
    private readonly shopFactory: ShopFacadeFactory,
    private readonly providerService: ProviderService,
  ) {
    const shop = this.shopFactory.build();

    if (shop !== null) {
      this.shopName$ = shop.shopName$;
      this.description$ = shop.description$;
      this.isShopResolved$ = shop.isResolved$;
      this.isAdmin$ = shop.isAdmin();
      this.shopIdentifier$ = shop.identifier$;
      this.homeLink$ = shop.identifier$.pipe(
        map(shopIdentifier => `/${shopIdentifier}`)
      );
    } else {
      this.shopName$ = of(environment.defaultShopName);
      this.description$ = of('');
      this.isShopResolved$ = of(false);
      this.isAdmin$ = of(false);
      this.shopIdentifier$ = of('');
      this.homeLink$ = of('/');
    }

    this.isWalletConnected$ = this.providerService.provider$.pipe(map(x => x !== null));
    this.walletAddress$ = this.providerService.address$.pipe(
      map(x => x.slice(0, 6) + '…' + x.slice(38))
    );
  }

  connectWallet() {
    this.providerService.connectWallet();
  }
}
