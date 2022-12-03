import { Component } from '@angular/core';
import { Observable, of } from 'rxjs';

import { faGithub, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { faArrowUpRightFromSquare, faBook, faCircle, faScrewdriverWrench } from '@fortawesome/free-solid-svg-icons';
import { map, pluck } from 'rxjs/operators';
import { NavService, NetworkService } from 'src/app/core';
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
  faTools = faScrewdriverWrench;
  faArrowUpRightFromSquare = faArrowUpRightFromSquare;

  isShopResolved$: Observable<boolean>;
  shopName$: Observable<string>;
  isShopIdentifierPresent$: Observable<boolean>;

  shortDescription$: Observable<string | null> = of(null);
  shopContractAddress$: Observable<string | null> = of(null);

  websiteHash = `${VERSION.version} (${VERSION.hash || 'UNKNOWN'})`;
  factoryContract: string;

  constructor(
    private readonly footerService: FooterService,
    private readonly networkService: NetworkService,
    private readonly navService: NavService
  ) {
    this.isShopIdentifierPresent$ = this.navService.navInfo$.pipe(
      map(x => !!x.shopIdentifier)
    );

    this.isShopResolved$ = this.footerService.footerInfo$.pipe(map(x => x.shop !== null));
    this.shopName$ = this.footerService.footerInfo$.pipe(pluck('shopName'));
    this.shortDescription$ = this.footerService.footerInfo$.pipe(pluck('shop'), pluck('shortDescription'));
    this.shopContractAddress$ = this.footerService.footerInfo$.pipe(pluck('shop'), pluck('shopContractAddress'));

    const network = this.networkService.getExpectedNetwork();
    this.factoryContract = network.shopFactoryContract;
  }
}
