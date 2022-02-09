import { Component, OnInit } from '@angular/core';
import { Web3ModalService } from '@mindsorg/web3modal-angular';
import { concat, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { BootstrapService } from 'src/app/shared';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'w3s-nav',
  templateUrl: './nav.component.html',
})
export class NavComponent {

  shopName$: Observable<string>
  description$: Observable<string>

  isShopResolved$: Observable<boolean>;
  isAdmin$: Observable<boolean> = of(false);
  isWalletConnected$: Observable<boolean> = of(false);

  constructor(
    private readonly bootstrapService: BootstrapService,
    private web3modalService: Web3ModalService,
  ) {
    this.shopName$ = concat(
      of(environment.defaultShopName),
      this.bootstrapService.configV1$.pipe(
        map(x => x.shopName)
      )
    );

    this.description$ = this.bootstrapService.configV1$.pipe(
      map(x => x.description)
    );

    this.isShopResolved$ = this.bootstrapService.isShopResolved$;
  }

  connectWallet() {
    this.web3modalService.open();
  }
}
