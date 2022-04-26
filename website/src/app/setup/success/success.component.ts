import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { faAward, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';

import { ShopDeployStateService } from '../new-shop/shop-deploy-state.service';

@Component({
  selector: 'w3s-success',
  templateUrl: './success.component.html',
})
export class SuccessComponent implements OnInit {
  faSuccess = faAward;
  faTriangleExclamation = faTriangleExclamation;

  existingShopUrl: string;

  constructor(
    private readonly router: Router,
    private readonly shopDeployStateService: ShopDeployStateService
  ) { }

  ngOnInit(): void {
    const identifier = this.shopDeployStateService.getShopIdentifier();
    if (identifier === null) {
      console.warn('No existing shop identifier was found');
      this.router.navigateByUrl('/');
    }

    this.existingShopUrl = this.makeUrl(identifier);
  }

  private makeUrl(shopIdentifier: string): string {
    const location = window.location;

    return `${location.protocol}//${location.host}/${shopIdentifier}`;
  }
}
