import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BootstrapService } from 'src/app/shared';

@Component({
  selector: 'w3s-header',
  templateUrl: './header.component.html',
})
export class HeaderComponent {

  shopName$: Observable<string>
  description$: Observable<string>

  constructor(
    private readonly bootstrapService: BootstrapService
  ) {
    this.shopName$ = this.bootstrapService.configV1$.pipe(
      map(x => x.shopName)
    );
    this.description$ = this.bootstrapService.configV1$.pipe(
      map(x => x.shortDescription)
    );
  }
}
