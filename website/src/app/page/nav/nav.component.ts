import { Component } from '@angular/core';

import { environment } from 'src/environments/environment';

@Component({
  selector: 'w3s-nav',
  templateUrl: './nav.component.html',
})
export class NavComponent {

  shopName: string;

  constructor() {
    this.shopName = environment.defaultShopName;
  }
}
