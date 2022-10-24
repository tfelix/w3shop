import { Component } from '@angular/core';
import { Observable, of } from 'rxjs';

import { faGithub, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { faArrowUpRightFromSquare, faBook, faCircle } from '@fortawesome/free-solid-svg-icons';
import { pluck } from 'rxjs/operators';
import { NetworkService } from 'src/app/core';
import { VERSION } from 'src/environments/version';
import { FooterService } from 'src/app/core';

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
  faArrowUpRightFromSquare = faArrowUpRightFromSquare;

  isShopResolved$: Observable<boolean>;
  shopName$: Observable<string>;

  shortDescription$: Observable<string | null> = of(null);
  shopContractAddress$: Observable<string | null> = of(null);

  websiteHash = VERSION.hash || 'UNKNOWN';
  factoryContract: string;

  constructor(
    private readonly footerService: FooterService,
    private readonly networkService: NetworkService,
  ) {
    this.isShopResolved$ = this.footerService.footerInfo$.pipe(pluck('isShopResolved'));
    this.shopName$ = this.footerService.footerInfo$.pipe(pluck('shopName'));
    const network = this.networkService.getExpectedNetwork();
    this.factoryContract = network.shopFactoryContract;
  }
}
