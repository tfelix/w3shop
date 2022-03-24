import { Component } from '@angular/core';
import { concat, Observable, of } from 'rxjs';
import { ConfigResolverService } from 'src/app/core';

import { faGithub, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { faBook, faCircle } from '@fortawesome/free-solid-svg-icons';
import { map } from 'rxjs/operators';

interface ShopInfo {
  contractAddr: string;
  shopName: string;
  shortDescription: string;
}

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

  shopInfo$: Observable<ShopInfo | null>;

  constructor(
    private configResolverService: ConfigResolverService,
  ) {
    this.shopInfo$ = concat(
      of(null),
      this.configResolverService.configV1$.pipe(
        map(c => {
          return {
            contractAddr: c.shopSmartContract,
            shopName: c.shopName,
            shortDescription: c.shortDescription
          };
        })
      )
    );
  }
}
