import { Component } from '@angular/core';
import { faShop } from '@fortawesome/free-solid-svg-icons';

import { environment } from 'src/environments/environment';

@Component({
  selector: 'w3s-nav',
  templateUrl: './nav.component.html',
})
export class NavComponent {

  faShop = faShop;

  shopName: string;

  constructor() {
    this.shopName = environment.defaultShopName;
  }
}
