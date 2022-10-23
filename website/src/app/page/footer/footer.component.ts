import { Component } from '@angular/core';
import { Observable } from 'rxjs';

import { faGithub, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { faArrowUpRightFromSquare, faBook, faCircle } from '@fortawesome/free-solid-svg-icons';
import { map } from 'rxjs/operators';
import { NetworkService, ShopInfoService } from 'src/app/core';
import { VERSION } from 'src/environments/version';

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

  websiteHash = VERSION.hash || 'UNKNOWN';
  factoryContract: string;

  constructor(
    private readonly shopInfoService: ShopInfoService,
    private readonly networkService: NetworkService,
  ) {
    this.shopInfo$ = this.shopInfoService.shopInfo$.pipe(
      map(si => {
        return { contractAddr: si.smartContractAddress, shopName: si.shopName, shortDescription: si.shortDescription }
      })
    );

    this.isShopResolved$ = this.shopInfoService.shopInfo$.pipe(map(x => x.isResolved));

    const network = this.networkService.getExpectedNetwork();
    this.factoryContract = network.shopFactoryContract;
  }
}
