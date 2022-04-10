import { Component, Inject } from '@angular/core';
import { combineLatest, concat, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { faWallet, faShop, faCirclePlus, faSliders } from '@fortawesome/free-solid-svg-icons';

import { WalletService, ShopService, ProviderService } from 'src/app/core';

@Component({
  selector: 'w3s-nav',
  templateUrl: './nav.component.html',
})
export class NavComponent {
  faWallet = faWallet;
  faShop = faShop;
  faCirclePlus = faCirclePlus;
  faSliders = faSliders;

  readonly homeLink$ = concat(
    of('/'),
    this.shopService.identifier$.pipe(
      map(shopIdentifier => `/${shopIdentifier}`)
    )
  );

  readonly shopName$: Observable<string>;
  readonly description$: Observable<string>;
  readonly isShopResolved$: Observable<boolean>;
  readonly shopIdentifier$: Observable<string>;

  readonly isAdmin$: Observable<boolean>;
  readonly walletAddress$: Observable<string>;

  // The cart is only displayed if we are connected and a shop is resolved.
  readonly isWalletConnected$: Observable<boolean>;

  constructor(
    @Inject('Shop') private readonly shopService: ShopService,
    private readonly providerService: ProviderService,
    private readonly walletService: WalletService
  ) {
    this.shopName$ = this.shopService.shopName$;
    this.description$ = this.shopService.description$;
    this.isShopResolved$ = this.shopService.isResolved$;
    this.isWalletConnected$ = this.providerService.provider$.pipe(map(x => x !== null));
    this.isAdmin$ = combineLatest([
      this.walletService.isAdmin$,
      this.shopService.isResolved$
    ]).pipe(
      map(([a, b]) => a && b),
    );

    this.walletAddress$ = this.providerService.address$.pipe(
      map(x => x.slice(0, 6) + '…' + x.slice(38))
    );
    this.shopIdentifier$ = this.shopService.identifier$;
  }

  connectWallet() {
    this.providerService.connectWallet();
  }
}
