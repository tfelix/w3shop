import { Component } from '@angular/core';
import { Observable } from 'rxjs';

import { faGithub, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { faArrowUpRightFromSquare, faBook, faCircle } from '@fortawesome/free-solid-svg-icons';
import { map, pluck } from 'rxjs/operators';
import { ShopInfoService } from 'src/app/core';
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
  shopInfo$: Observable<ShopInfo>;

  websiteHash = VERSION.hash;
  factoryContract = environment.shopFactoryAddr;
  factoryContractHref: string;

  constructor(
    private readonly shopInfoService: ShopInfoService
  ) {
    this.shopInfo$ = this.shopInfoService.shopInfo$.pipe(
      map(si => {
        return { contractAddr: si.smartContractAddress, shopName: si.shopName, shortDescription: si.shortDescription }
      })
    );

    this.isShopResolved$ = this.shopInfoService.shopInfo$.pipe(map(x => x.isResolved));

    if (environment.production) {
      this.factoryContractHref = `https://arbiscan.io/address/${environment.shopFactoryAddr}`;
    } else {
      this.factoryContractHref = `https://testnet.arbiscan.io/address/${environment.shopFactoryAddr}`;
    }
  }
}
