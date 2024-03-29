import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NavService } from 'src/app/core';
import { filterNotNull } from 'src/app/shared';

@Component({
  selector: 'w3s-header',
  templateUrl: './header.component.html',
})
export class HeaderComponent {

  shopName$: Observable<string>;
  description$: Observable<string>;

  constructor(
    private readonly navService: NavService
  ) {

    this.shopName$ = this.navService.navInfo$.pipe(map(x => x.shopName));
    this.description$ = this.navService.navInfo$.pipe(
      map(x => x.shop),
      filterNotNull(),
      map(x => x.shortDescription)
    );
  }
}
