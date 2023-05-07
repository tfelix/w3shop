import { Component } from '@angular/core';
import { Observable, of } from 'rxjs';

import { faGithub, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { faArrowUpRightFromSquare, faBook, faCircle, faScrewdriverWrench } from '@fortawesome/free-solid-svg-icons';
import { map } from 'rxjs/operators';
import { NetworkService, ShopDetailsBootService } from 'src/app/core';
import { VERSION } from 'src/environments/version';
import { ShopServiceFactory } from '../shop-service-factory.service';

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

  showShopFooter$: Observable<boolean>;
  shopContractAddress$: Observable<string | null> = of(null);

  websiteHash = `${VERSION.version} (${VERSION.hash || 'UNKNOWN'})`;
  factoryContract: string;

  constructor(
    private readonly bootService: ShopDetailsBootService,
    private readonly networkService: NetworkService,
    private readonly shopServiceFactory: ShopServiceFactory
  ) {
    this.shopContractAddress$ = this.bootService.shopDetails$.pipe(
      map(sd => {
        if (sd === null) {
          return null;
        } else {
          return sd.contractAddress;
        }
      })
    );

    this.showShopFooter$ = this.shopServiceFactory.isUserOnCorrectNetwork$;

    const network = this.networkService.getExpectedNetwork();
    this.factoryContract = network.shopFactoryContract;
  }
}
