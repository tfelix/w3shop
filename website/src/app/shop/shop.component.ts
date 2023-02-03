import { Component, OnInit } from '@angular/core';
import { concat, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { NavService } from '../core';
import { ShopServiceFactory } from './shop-service-factory.service';

@Component({
  templateUrl: './shop.component.html',
})
export class ShopComponent implements OnInit {

  shopIdentifier$: Observable<string>;
  isShopResolved$: Observable<boolean>;

  constructor(
    private readonly navService: NavService,
    private readonly shopFactory: ShopServiceFactory
  ) {
  }

  ngOnInit(): void {
    this.isShopResolved$ = concat(
      of(false),
      this.shopFactory.getShopService().pipe(
        map(_ => true),
        catchError(_ => of(false))
      )
    );

    this.shopIdentifier$ = this.navService.navInfo$.pipe(
      map(s => s.shopIdentifier)
    );
  }
}
