import { Component } from '@angular/core';
import { Observable } from 'rxjs';

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
  shopDefaultName = environment.defaultShopName;
  factoryContract = environment.shopFactoryAddr;
  factoryContractHref: string;

  constructor(
    readonly shopFacadeFactory: ShopServiceFactory,
  ) {
    const shop$ = shopFacadeFactory.shopService$;
    this.isShopResolved$ = shop$.pipe(map(x => x !== null));

    this.shopInfo$ = shop$.pipe(
      map((shop => {
        if (shop !== null) {
          return { contractAddr: shop.smartContractAddress, shopName: shop.shopName, shortDescription: shop.shortDescription }
        } else {
          return { contractAddr: '', shopName: '', shortDescription: '' };
        }
      })
      ));

    if (environment.production) {
      this.factoryContractHref = `https://arbiscan.io/address/${environment.shopFactoryAddr}`;
    } else {
      this.factoryContractHref = `https://testnet.arbiscan.io/address/${environment.shopFactoryAddr}`;
    }
  }
}
