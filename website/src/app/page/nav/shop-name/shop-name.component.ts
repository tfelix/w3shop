import { Component } from '@angular/core';

import { Observable } from 'rxjs';
import { map, pluck } from 'rxjs/operators';
import { NavService } from 'src/app/core';

@Component({
  selector: 'w3s-shop-name',
  templateUrl: './shop-name.component.html',
  styleUrls: ['./shop-name.component.scss']
})
export class ShopNameComponent {

  isShopResolved$: Observable<boolean>;
  shopName$: Observable<string>;
  shopHomeLink$: Observable<string[]>;

  constructor(
    private readonly navService: NavService
  ) {
    this.shopName$ = this.navService.navInfo$.pipe(pluck('shopName'));
    this.isShopResolved$ = this.navService.navInfo$.pipe(
      pluck('shopIdentfier'),
      map(x => x !== null)
    );
    this.shopHomeLink$ = this.navService.navInfo$.pipe(
      map(x => {
        if (x.shopIdentifier !== null) {
          return ['/', 's', x.shopIdentifier];
        } else {
          return ['/'];
        }
      })
    );
  }
}
