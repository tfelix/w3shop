import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';

import { NavService, ShopIdentifierService, SmartContractDetails } from 'src/app/core';
import { ShopDetailsBootService } from '../core/shop-details-boot.service';

import { ShopServiceFactory } from './shop-service-factory.service';

/**
 * Checks if
 */
@Injectable({
  providedIn: 'root'
})
export class ShopResolvedGuard implements CanActivate, CanActivateChild {

  constructor(
    private readonly shopIdentifierService: ShopIdentifierService,
    private readonly shopServiceFactory: ShopServiceFactory,
    private readonly bootService: ShopDetailsBootService,
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
    this.bootService.registerShopIdentifier(encodedShopIdentifier);
    const details = this.shopIdentifierService.getSmartContractDetails(encodedShopIdentifier);

    this.initializeServices(details);

    return true;
  }

  /**
 * Because accessing the route data inside of services does not really work, we initialize every
 * service here with the resolved contract details.
 */
  private initializeServices(details: SmartContractDetails) {
    this.shopServiceFactory.setSmartContractDetails(details);
    this.navService.updateShopIdentifier(details.identifier);
  }
}