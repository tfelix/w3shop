import { Component, SecurityContext } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { marked } from 'marked';

import { BootstrapService } from 'src/app/shared';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'w3s-about',
  templateUrl: './about.component.html',
})
export class AboutComponent {

  description$: Observable<string | null>

  constructor(
    private readonly bootstrapService: BootstrapService,
    private readonly sanitizer: DomSanitizer
  ) {
    this.description$ = this.bootstrapService.configV1$.pipe(
      map(x => marked.parse(x.description)),
      map(x => this.sanitizer.sanitize(SecurityContext.HTML, x))
    )
  }
}
