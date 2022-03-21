import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ConfigResolverService } from 'src/app/core';

@Component({
  selector: 'w3s-header',
  templateUrl: './header.component.html',
})
export class HeaderComponent {

  shopName$: Observable<string>
  description$: Observable<string>

  constructor(
    private readonly configResolverService: ConfigResolverService
  ) {
    this.shopName$ = this.configResolverService.configV1$.pipe(
      map(x => x.shopName)
    );
    this.description$ = this.configResolverService.configV1$.pipe(
      map(x => x.shortDescription)
    );
  }
}
