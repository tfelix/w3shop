import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';

import { ShopIdentifierService, SmartContractDetails } from '../core';

@Injectable({
  providedIn: 'root'
})
export class ShopDetailsResolver implements Resolve<SmartContractDetails> {

  constructor(
    private readonly shopIdentifierService: ShopIdentifierService
  ) {}

  resolve(route: ActivatedRouteSnapshot): SmartContractDetails {
    const encodedShopIdentifier = route.paramMap.get('bootstrap');
    const details = this.shopIdentifierService.getSmartContractDetails(encodedShopIdentifier);

    return details;
  }
}