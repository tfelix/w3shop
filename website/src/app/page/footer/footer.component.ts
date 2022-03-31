import { Component, Inject } from '@angular/core';
import { concat, forkJoin, Observable, of } from 'rxjs';

import { faGithub, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { faBook, faCircle } from '@fortawesome/free-solid-svg-icons';
import { map } from 'rxjs/operators';
import { ShopService } from 'src/app/core';

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

  isShopResolved$: Observable<boolean>;
  shopInfo$: Observable<ShopInfo | null>;

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

    this.isShopResolved$ = shopService.isResolved$;
  }
}
