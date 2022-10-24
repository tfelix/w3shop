import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, RouterStateSnapshot, UrlTree } from '@angular/router';
import { merge, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ShopServiceFactory } from 'src/app/core';


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
    private readonly shopFacadeFactory: ShopServiceFactory
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

    // TODO this fails in the admin menu because initially the shop is null. We need to somehow wait until it
    // is intiallized.
    return this.shopFacadeFactory.shopService$.pipe(map(shop => shop.isAdmin));
  }
}
