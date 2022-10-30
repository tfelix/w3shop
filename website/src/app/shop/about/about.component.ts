import { Component, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Observable } from 'rxjs';
import { map, pluck } from 'rxjs/operators';

import { marked } from 'marked';
import { ShopServiceFactory } from '../shop-service-factory.service';


@Component({
  selector: 'w3s-about',
  templateUrl: './about.component.html',
})
export class AboutComponent {

  description$: Observable<string | null>

  constructor(
    private readonly shopFactory: ShopServiceFactory,
    private readonly sanitizer: DomSanitizer
  ) {
    this.description$ = this.shopFactory.shopService$.pipe(
      pluck('description'),
      map(x => marked.parse(x)),
      map(x => this.sanitizer.sanitize(SecurityContext.HTML, x))
    )
  }
}
