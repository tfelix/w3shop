import { Component, Inject } from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';

import { faWallet, faShop } from '@fortawesome/free-solid-svg-icons';

import { WalletService, BootstrapService, BlockchainService } from 'src/app/core';

@Component({
  selector: 'w3s-nav',
  templateUrl: './nav.component.html',
})
export class NavComponent {
  faWallet = faWallet;
  faShop = faShop;

  homeLink = '/';

  readonly shopName$: Observable<string>;
  readonly description$: Observable<string>;
  readonly isShopResolved$: Observable<boolean>;
  readonly shopIdentifier$: Observable<string>;

  readonly isAdmin$: Observable<boolean>;
  readonly walletAddress$: Observable<string>;

  // The cart is only displayed if we are connected and a shop is resolved.
  readonly isWalletConnected$: Observable<boolean>;

  constructor(
    private readonly bootstrapService: BootstrapService,
    @Inject('Blockchain') private readonly blockchainService: BlockchainService,
    private readonly walletService: WalletService
  ) {
    this.shopName$ = this.bootstrapService.shopName$;
    this.description$ = this.bootstrapService.configV1$.pipe(
      map(x => x.description)
    );

    this.isShopResolved$ = this.bootstrapService.isShopResolved$;
    this.isWalletConnected$ = this.walletService.isConnected$;
    this.isAdmin$ = this.blockchainService.isAdmin$;
    this.walletAddress$ = this.walletService.address$.pipe(
      map(x => x.slice(0, 6) + '…' + x.slice(38))
    )

    this.shopIdentifier$ = this.bootstrapService.shopIdentifier$;
    this.shopIdentifier$.subscribe(shopIdentifier => this.homeLink = `/${shopIdentifier}`);
  }

  connectWallet() {
    this.walletService.connectWallet().subscribe();
  }
}
