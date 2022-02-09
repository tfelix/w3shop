import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { marked } from 'marked';
import * as DOMPurify from 'dompurify';

import { BootstrapService } from 'src/app/shared';

@Component({
  selector: 'w3s-about',
  templateUrl: './about.component.html',
})
export class AboutComponent {

  description$: Observable<string>

  constructor(
    private readonly bootstrapService: BootstrapService
  ) {
    this.description$ = this.bootstrapService.configV1$.pipe(
      map(x => marked.parse(x.description)),
      map(x => DOMPurify.sanitize(x))
    )
  }
}
