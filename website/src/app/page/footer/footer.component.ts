import { Component, Inject } from '@angular/core';
import { concat, forkJoin, Observable, of } from 'rxjs';

import { faGithub, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { faArrowUpRightFromSquare, faBook, faCircle } from '@fortawesome/free-solid-svg-icons';
import { map } from 'rxjs/operators';
import { ShopService } from 'src/app/core';
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
    @Inject('Shop') private shopService: ShopService,
  ) {
    this.shopInfo$ = forkJoin([
      this.shopService.smartContract$,
      this.shopService.shopName$,
      this.shopService.shortDescription$
    ]).pipe(
      map(([contractAddr, shopName, shortDescription]) => ({ contractAddr, shopName, shortDescription }))
    );

    if(environment.production) {
      this.factoryContractHref = `https://arbiscan.io/address/${environment.shopFactoryAddr}`;
    } else {
      this.factoryContractHref = `https://testnet.arbiscan.io/address/${environment.shopFactoryAddr}`;
    }

    this.isShopResolved$ = shopService.isResolved$;
  }
}
