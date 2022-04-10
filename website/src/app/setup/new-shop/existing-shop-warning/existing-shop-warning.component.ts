import { Component } from '@angular/core';
import { ExistingShopService } from '../existing-shop.service';

@Component({
  selector: 'w3s-existing-shop-warning',
  templateUrl: './existing-shop-warning.component.html',
})
export class ExistingShopWarningComponent {

  isShopUrlPresent: boolean;

  constructor(
    private readonly existingShopService: ExistingShopService
  ) {
    this.isShopUrlPresent = this.existingShopService.existingShopUrl !== null;
  }
}
