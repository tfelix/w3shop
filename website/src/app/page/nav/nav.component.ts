import { Component, Inject } from '@angular/core';
import { combineLatest, concat, forkJoin, Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { faWallet, faShop, faCirclePlus, faSliders } from '@fortawesome/free-solid-svg-icons';

import { WalletService, BlockchainService, ShopService } from 'src/app/core';

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
    @Inject('Blockchain') private readonly blockchainService: BlockchainService,
    private readonly walletService: WalletService
  ) {
    this.shopName$ = this.shopService.shopName$;
    this.description$ = this.shopService.description$;
    this.isShopResolved$ = this.shopService.isResolved$;
    this.isWalletConnected$ = this.walletService.isConnected$;
    this.isAdmin$ = combineLatest([
      this.blockchainService.isAdmin$,
      this.shopService.isResolved$
    ]).pipe(
      map(([a, b]) => a && b),
    );

    this.walletAddress$ = this.walletService.adress$.pipe(
      map(x => x.slice(0, 6) + '…' + x.slice(38))
    )
    this.shopIdentifier$ = this.shopService.identifier$;
  }

  connectWallet() {
    this.walletService.connectWallet().subscribe();
  }
}
