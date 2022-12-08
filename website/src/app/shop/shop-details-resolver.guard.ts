import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';

import { ShopDetailsBootService } from 'src/app/core';

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
    private readonly shopBootstrapService: ShopDetailsBootService,
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
    this.shopBootstrapService.registerShopIdentifier(encodedShopIdentifier);

    return true;
  }
}