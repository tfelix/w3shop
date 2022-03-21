import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfigResolverService } from 'src/app/core';

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
    private configResolverService: ConfigResolverService,
  ) {
    this.isShopResolved$ = this.configResolverService.isResolved$;
    this.shopName$ = this.configResolverService.shopName$;
  }
}
