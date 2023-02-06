import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { ShopServiceFactory } from '../../shop-service-factory.service';

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
    private readonly shopServiceFactory: ShopServiceFactory,
  ) {
  }

  ngOnInit(): void {
    this.isShopResolved$ = this.shopServiceFactory.isUserOnCorrectNetwork$;

    const shop$ = this.shopServiceFactory.getShopService().pipe(
      shareReplay(1)
    );

    this.shopName$ = shop$.pipe(
      map(x => x.shopName)
    );

    this.shortDescription$ = shop$.pipe(
      map(x => x.shortDescription)
    );
  }
}
