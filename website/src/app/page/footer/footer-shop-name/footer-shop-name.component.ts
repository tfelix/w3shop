import { Component, OnInit } from '@angular/core';
import { concat, Observable, of } from 'rxjs';
import { map, pluck } from 'rxjs/operators';
import { FooterService } from 'src/app/core';

@Component({
  selector: 'w3s-footer-shop-name',
  templateUrl: './footer-shop-name.component.html',
  styleUrls: ['./footer-shop-name.component.scss']
})
export class FooterShopNameComponent implements OnInit {

  isShopResolved$: Observable<boolean>;
  shopName$: Observable<string>;
  shortDescription$: Observable<string>;

  constructor(
    private readonly footerService: FooterService,
  ) {
  }

  ngOnInit(): void {
    this.isShopResolved$ = concat(
      of(false),
      this.footerService.footerInfo$.pipe(pluck('shop'), map(s => s !== null))
    );

    this.shopName$ = this.footerService.footerInfo$.pipe(
      pluck('shopName')
    );

    this.shortDescription$ = this.footerService.footerInfo$.pipe(
      map(x => {
        if (x.shop) {
          return x.shop.shortDescription;
        } else {
          return '';
        }
      })
    );
  }
}
