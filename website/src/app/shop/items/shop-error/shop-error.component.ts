import { Component } from '@angular/core';
import { faCartShopping, faCircleExclamation, faFaceSadTear, faNetworkWired, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { Observable } from 'rxjs';

import { ProviderService } from 'src/app/blockchain';
import { NetworkService } from 'src/app/core';

import { ShopErrorService, ShopStatus } from './shop-error.service';

@Component({
  selector: 'w3s-shop-error',
  templateUrl: './shop-error.component.html',
})
export class ShopErrorComponent {
  // makes the ShopStatus enum available in the template
  ShopStatus = ShopStatus;

  faCartShopping = faCartShopping;
  faSpinner = faSpinner;
  faFaceSadTear = faFaceSadTear;
  faWrongNetwork = faNetworkWired;
  faCircleExclamation = faCircleExclamation;

  networkName: string;
  shopStatus$: Observable<ShopStatus>;

  constructor(
    private readonly shopErrorService: ShopErrorService,
    private readonly providerService: ProviderService,
    private readonly networkService: NetworkService
  ) {
    this.shopStatus$ = this.shopErrorService.shopStatus$;
    this.networkName = this.networkService.getExpectedNetwork().network;
  }

  connectWallet() {
    this.providerService.connectWallet();
  }

  switchNetwork() {
    this.providerService.switchNetworkToSelected();
  }
}
