import { Component } from '@angular/core';
import { merge, Observable, of } from 'rxjs';
import { map, pluck } from 'rxjs/operators';
import { NavService } from 'src/app/core';

@Component({
  selector: 'w3s-shop-name',
  templateUrl: './shop-name.component.html',
  styleUrls: ['./shop-name.component.scss']
})
export class ShopNameComponent {

  shopName$: Observable<string>;

  shopHomeLink$: Observable<string>;

  constructor(
    private readonly navService: NavService
  ) {
    this.shopName$ = this.navService.navInfo$.pipe(pluck('shopName'));

    this.shopHomeLink$ = merge(
      of('/'),
      this.navService.navInfo$.pipe(
        map(x => {
          if (x.shop !== null) {
            return `/s/${x.shopIdentifier}`;
          } else {
            return '/';
          }
        })
      )
    );
  }
}