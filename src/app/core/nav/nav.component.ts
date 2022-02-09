import { Component, OnInit } from '@angular/core';
import { Web3ModalService } from '@mindsorg/web3modal-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BootstrapService } from 'src/app/shared';

@Component({
  selector: 'w3s-nav',
  templateUrl: './nav.component.html',
})
export class NavComponent{

  shopName$: Observable<string>
  description$: Observable<string>

  constructor(
    private readonly bootstrapService: BootstrapService,
    private web3modalService: Web3ModalService,
  ) {
    this.shopName$ = this.bootstrapService.configV1$.pipe(
      map(x => x.shopName)
    );
    this.description$ = this.bootstrapService.configV1$.pipe(
      map(x => x.description)
    );
  }

  connectWallet() {
    this.web3modalService.open();
  }
}
