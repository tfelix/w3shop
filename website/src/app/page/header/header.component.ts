import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { pluck } from 'rxjs/operators';
import { ShopServiceFactory } from 'src/app/core';

@Component({
  selector: 'w3s-header',
  templateUrl: './header.component.html',
})
export class HeaderComponent {

  shopName$: Observable<string>
  description$: Observable<string>

  constructor(
    private readonly shopFacadeFactory: ShopServiceFactory
  ) {
    this.shopName$ = this.shopFacadeFactory.shopService$.pipe(pluck('shopName'));
    this.description$ = this.shopFacadeFactory.shopService$.pipe(pluck('shortDescription'));
  }
}
