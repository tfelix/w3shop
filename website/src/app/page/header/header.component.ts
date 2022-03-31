import { Component, Inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ShopService } from 'src/app/core';

@Component({
  selector: 'w3s-header',
  templateUrl: './header.component.html',
})
export class HeaderComponent {

  shopName$: Observable<string>
  description$: Observable<string>

  constructor(
    @Inject('Shop') private readonly shopService: ShopService
  ) {
    this.shopName$ = this.shopService.shopName$;
    this.description$ = this.shopService.description$;
  }
}
