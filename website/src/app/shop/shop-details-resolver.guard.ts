import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';

import { NavService, ScopedLocalStorage, ShopIdentifierService, SmartContractDetails } from 'src/app/core';

import { ShopServiceFactory } from './shop-service-factory.service';

/**
 * This could actually be a Resolver. However sadly Angular only calls Resolver after a guard
 * has executed. But we need this logic to run first to access the shop identifier and set it
 * up for the admin guard to work (calls contract logic).
 * There is a hack by making this a guard.
 */
@Injectable({
  providedIn: 'root'
})
export class ShopDetailsResolverGuard implements CanActivate, CanActivateChild {

  constructor(
    private readonly shopIdentifierService: ShopIdentifierService,
    private readonly localStorage: ScopedLocalStorage,
    private readonly shopServiceFactory: ShopServiceFactory,
    private readonly navService: NavService
  ) { }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
    return this.canActivate(childRoute, state);
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    _: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    // TODO in case there is an error with decoding the identifier, consider to move the user to
    // an error page for a better UX instead of failing here.
    const encodedShopIdentifier = route.paramMap.get('bootstrap');
    const details = this.shopIdentifierService.getSmartContractDetails(encodedShopIdentifier);

    this.initializeServices(details);

    return true;
  }

  /**
 * Because accessing the route data inside of services does not really work, we initialize every
 * service here with the resolved contract details.
 */
  private initializeServices(details: SmartContractDetails) {
    this.localStorage.setShopIdentifier(details.identifier);
    this.shopServiceFactory.setSmartContractDetails(details);
    this.navService.updateShopIdentifier(details.identifier);
  }
}