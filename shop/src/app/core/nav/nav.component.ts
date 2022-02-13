import { Component } from '@angular/core';
import { combineLatest, Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { BootstrapService } from 'src/app/shared';
import { WalletService } from 'src/app/shared/wallet.service';

@Component({
  selector: 'w3s-nav',
  templateUrl: './nav.component.html',
})
export class NavComponent {
  homeLink = '/';

  readonly shopName$: Observable<string>;
  readonly description$: Observable<string>;
  readonly isShopResolved$: Observable<boolean>;
  readonly shopIdentifier$: Observable<string>;

  readonly isWalletConnected$: Observable<boolean>;
  readonly isAdmin$: Observable<boolean>;
  readonly walletAddress$: Observable<string>;

  // The cart is only displayed if we are connected and a shop is resolved.
  readonly isCartDisplayed$: Observable<boolean>;
  readonly isSimpleConnectedDisplayed$: Observable<boolean>;

  constructor(
    private readonly bootstrapService: BootstrapService,
    private readonly walletService: WalletService
  ) {
    this.shopName$ = this.bootstrapService.shopName$;
    this.description$ = this.bootstrapService.configV1$.pipe(
      map(x => x.description)
    );

    this.isShopResolved$ = this.bootstrapService.isShopResolved$;
    this.isWalletConnected$ = this.walletService.isConnected$;
    this.isAdmin$ = this.walletService.isAdmin$;
    this.walletAddress$ = this.walletService.address$;

    this.shopIdentifier$ = this.bootstrapService.shopIdentifier$;
    this.shopIdentifier$.subscribe(shopIdentifier => this.homeLink = `/${shopIdentifier}`);

    this.isCartDisplayed$ = combineLatest([this.isShopResolved$, this.isWalletConnected$]).pipe(
      map(([isShopResolved, isWalletConnected]) => isShopResolved && isWalletConnected)
    );

    this.isSimpleConnectedDisplayed$ = combineLatest([this.isShopResolved$, this.isWalletConnected$]).pipe(
      map(([isShopResolved, isWalletConnected]) => !isShopResolved && isWalletConnected)
    );
  }

  connectWallet() {
    this.walletService.connectWallet();
  }
}
