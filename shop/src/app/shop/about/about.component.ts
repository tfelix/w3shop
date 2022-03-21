import { Component, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { marked } from 'marked';
import { ConfigResolverService } from 'src/app/core';


@Component({
  selector: 'w3s-about',
  templateUrl: './about.component.html',
})
export class AboutComponent {

  description$: Observable<string | null>

  constructor(
    private readonly configResolverService: ConfigResolverService,
    private readonly sanitizer: DomSanitizer
  ) {
    this.description$ = this.configResolverService.configV1$.pipe(
      map(x => marked.parse(x.description)),
      map(x => this.sanitizer.sanitize(SecurityContext.HTML, x))
    )
  }
}
