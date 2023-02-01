import { Component, OnInit } from '@angular/core';
import { concat, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { NavService } from '../core';
import { ShopServiceFactory } from './shop-service-factory.service';

@Component({
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.scss']
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
      this.shopFactory.getShopService().pipe(map(_ => true))
    );

    this.shopIdentifier$ = this.navService.navInfo$.pipe(
      map(s => s.shopIdentifier)
    );
  }
}
