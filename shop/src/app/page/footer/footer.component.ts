import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { BootstrapService } from 'src/app/core';

import { faGithub, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { faBook, faCircle } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'w3s-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {

  faTwitter = faTwitter;
  faGithub = faGithub;
  faBook = faBook;
  faCircle = faCircle;

  shopName$: Observable<string>;
  isShopResolved$: Observable<boolean>;

  constructor(
    private bootstrapService: BootstrapService,
  ) {
    this.isShopResolved$ = this.bootstrapService.isShopResolved$;
    this.shopName$ = this.bootstrapService.shopName$;
  }
}
