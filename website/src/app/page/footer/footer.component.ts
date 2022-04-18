import { Component } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';

import { faGithub, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { faArrowUpRightFromSquare, faBook, faCircle } from '@fortawesome/free-solid-svg-icons';
import { map } from 'rxjs/operators';
import { ShopServiceFactory } from 'src/app/core';
import { VERSION } from 'src/environments/version';
import { environment } from 'src/environments/environment';

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
  faArrowUpRightFromSquare = faArrowUpRightFromSquare;

  isShopResolved$: Observable<boolean>;
  shopInfo$: Observable<ShopInfo | null>;

  websiteHash = VERSION.hash;
  factoryContract = environment.shopFactoryAddr;
  factoryContractHref: string;

  constructor(
    readonly shopFacadeFactory: ShopServiceFactory,
  ) {
    const shopFacade = shopFacadeFactory.build();

    if (shopFacade !== null) {
      this.shopInfo$ = forkJoin([
        shopFacade.smartContractAddress$,
        shopFacade.shopName$,
        shopFacade.shortDescription$
      ]).pipe(
        map(([contractAddr, shopName, shortDescription]) => ({ contractAddr, shopName, shortDescription }))
      );
      this.isShopResolved$ = shopFacade.isResolved$;
    } else {
      this.shopInfo$ = of({ contractAddr: '', shopName: '', shortDescription: '' });
      this.isShopResolved$ = of(false);
    }

    if (environment.production) {
      this.factoryContractHref = `https://arbiscan.io/address/${environment.shopFactoryAddr}`;
    } else {
      this.factoryContractHref = `https://testnet.arbiscan.io/address/${environment.shopFactoryAddr}`;
    }
  }
}
