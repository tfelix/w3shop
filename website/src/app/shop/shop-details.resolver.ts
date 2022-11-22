import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';

import { ScopedLocalStorage, ShopIdentifierService, SmartContractDetails } from 'src/app/core';
import { ShopServiceFactory } from './shop-service-factory.service';

@Injectable({
  providedIn: 'root'
})
export class ShopDetailsResolver implements Resolve<SmartContractDetails> {

  constructor(
    private readonly shopIdentifierService: ShopIdentifierService,
    private readonly localStorage: ScopedLocalStorage,
    private readonly shopServiceFactory: ShopServiceFactory
  ) { }

  resolve(route: ActivatedRouteSnapshot): SmartContractDetails {
    // TODO in case there is an error with decoding the identifier, consider to move the user to
    // an error page for a better UX instead of failing here.
    /*
        return this.newsService.getTopPosts().pipe(catchError(() => {
      this.router.navigate(['/']);
      return EMPTY;
    }));
    */
    const encodedShopIdentifier = route.paramMap.get('bootstrap');
    const details = this.shopIdentifierService.getSmartContractDetails(encodedShopIdentifier);

    this.initializeServices(details);

    return details;
  }

  /**
   * Because accessing the route data inside of services does not really work, we initialize every
   * service here with the resolved contract details.
   */
  private initializeServices(details: SmartContractDetails) {
    this.localStorage.setShopIdentifier(details.identifier);
    this.shopServiceFactory.setSmartContractDetails(details);
  }
}