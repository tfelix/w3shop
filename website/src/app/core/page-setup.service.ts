import { Inject, Injectable } from "@angular/core";
import { Meta, MetaDefinition, Title } from "@angular/platform-browser";
import { forkJoin } from "rxjs";

import { ShopService } from "./shop/shop.service";

@Injectable({
  providedIn: 'root'
})
export class PageSetupService {
  constructor(
    private meta: Meta,
    private titleService: Title,
    @Inject('Shop') private shopService: ShopService
  ) {
    this.shopService.isResolved$.subscribe(isResolved => {
      if (isResolved) {
        forkJoin([
          this.shopService.shopName$,
          this.shopService.shortDescription$,
          this.shopService.keywords$,
        ]).subscribe(([shopName, desc, keywords]) => {
          this.titleService.setTitle(shopName);

          const metaDefinitions: MetaDefinition[] = [
            { property: 'og:title', content: shopName },
            { property: 'og:description', content: desc },
            { name: 'keywords', content: keywords.join(', ') },
          ];
          metaDefinitions.forEach(t => this.meta.updateTag(t));
        });
      }
    });
  }
}
