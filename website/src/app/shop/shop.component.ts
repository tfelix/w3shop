import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { NavService } from '../core';

@Component({
  templateUrl: './shop.component.html',
})
export class ShopComponent {

  shopIdentifier$: Observable<string>;

  constructor(
    private readonly navService: NavService,
  ) {

    this.shopIdentifier$ = this.navService.navInfo$.pipe(
      map(s => s.shopIdentifier)
    );
  }
}
