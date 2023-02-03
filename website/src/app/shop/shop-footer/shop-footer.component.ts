import { Component } from '@angular/core';
import { Observable, of } from 'rxjs';

import { faGithub, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { faArrowUpRightFromSquare, faBook, faCircle, faScrewdriverWrench } from '@fortawesome/free-solid-svg-icons';
import { map, pluck } from 'rxjs/operators';
import { NavService, NetworkService, ShopDetailsBootService } from 'src/app/core';
import { VERSION } from 'src/environments/version';
import { FooterService } from 'src/app/core';

@Component({
  selector: 'w3s-shop-footer',
  templateUrl: './shop-footer.component.html',
  styleUrls: ['./shop-footer.component.scss']
})
export class ShopFooterComponent {

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
    private readonly bootService: ShopDetailsBootService,
    private readonly footerService: FooterService,
    private readonly networkService: NetworkService,
    private readonly navService: NavService
  ) {
    this.isShopIdentifierPresent$ = this.navService.navInfo$.pipe(
      map(x => !!x.shopIdentifier)
    );

    this.shopContractAddress$ = this.bootService.shopDetails$.pipe(
      map(sd => {
        if (sd === null) {
          return null;
        } else {
          return sd.contractAddress;
        }
      })
    );

    this.isShopResolved$ = this.footerService.footerInfo$.pipe(map(x => x.shop !== null));
    this.shopName$ = this.footerService.footerInfo$.pipe(pluck('shopName'));
    this.shortDescription$ = this.footerService.footerInfo$.pipe(pluck('shop'), pluck('shortDescription'));

    const network = this.networkService.getExpectedNetwork();
    this.factoryContract = network.shopFactoryContract;
  }
}
