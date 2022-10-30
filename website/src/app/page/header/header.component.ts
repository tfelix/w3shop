import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { pluck } from 'rxjs/operators';
import { NavService } from 'src/app/core';
import { filterNotNull } from 'src/app/shared';

@Component({
  selector: 'w3s-header',
  templateUrl: './header.component.html',
})
export class HeaderComponent {

  shopName$: Observable<string>
  description$: Observable<string>

  constructor(
    private readonly navService: NavService
  ) {

    this.shopName$ = this.navService.navInfo$.pipe(pluck('shopName'));
    this.description$ = this.navService.navInfo$.pipe(
      pluck('shop'),
      filterNotNull(),
      pluck('shortDescription')
    );
  }
}
