import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';

import { ShopFacadeFactory } from 'src/app/core';


/**
 * To make admin lazy:
 *  - add admin routing module
 *  - modify the app routing module to lazy load
 *  - place this guard in the app or shared module?
 */
@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate, CanActivateChild {

  constructor(
    private readonly shopFacadeFactory: ShopFacadeFactory
  ) { }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
    return this.canActivate(childRoute, state);
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    const shop = this.shopFacadeFactory.build();

    if (shop) {
      return shop.isAdmin();
    } else {
      return false;
    }
  }
}
