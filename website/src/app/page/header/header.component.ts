import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { ShopFacadeFactory } from 'src/app/core';

@Component({
  selector: 'w3s-header',
  templateUrl: './header.component.html',
})
export class HeaderComponent {

  shopName$: Observable<string>
  description$: Observable<string>

  constructor(
    private readonly shopFacadeFactory: ShopFacadeFactory
  ) {
    const shop = this.shopFacadeFactory.build();
    this.shopName$ = shop.shopName$;
    this.description$ = shop.shortDescription$;
  }
}
