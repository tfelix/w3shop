import { Component, Inject, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { marked } from 'marked';
import { ShopService } from 'src/app/core';


@Component({
  selector: 'w3s-about',
  templateUrl: './about.component.html',
})
export class AboutComponent {

  description$: Observable<string | null>

  constructor(
    @Inject('Shop') private readonly shopService: ShopService,
    private readonly sanitizer: DomSanitizer
  ) {
    this.description$ = this.shopService.description$.pipe(
      map(x => marked.parse(x)),
      map(x => this.sanitizer.sanitize(SecurityContext.HTML, x))
    )
  }
}
