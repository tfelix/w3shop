import { Component } from '@angular/core';
import { ShopDeployStateService } from '../shop-deploy-state.service';

@Component({
  selector: 'w3s-existing-shop-warning',
  templateUrl: './existing-shop-warning.component.html',
})
export class ExistingShopWarningComponent {

  isShopUrlPresent: boolean;

  constructor(
    private readonly shopDeployStateService: ShopDeployStateService
  ) {
    this.isShopUrlPresent = this.shopDeployStateService.getShopIdentifier() !== null;
  }

  close() {
    this.shopDeployStateService.clearShopIdentifier();
    this.isShopUrlPresent = false;
  }
}
