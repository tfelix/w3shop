import { Injectable } from "@angular/core";
import { Meta, MetaDefinition, Title } from "@angular/platform-browser";
import { forkJoin } from "rxjs";

import { ShopFacadeFactory } from "./shop/shop-service-factory.service";

@Injectable({
  providedIn: 'root'
})
export class PageSetupService {
  constructor(
    private meta: Meta,
    private titleService: Title,
    private shopService: ShopFacadeFactory
  ) {
    const shop = this.shopService.build();

    forkJoin([
      shop.shopName$,
      shop.shortDescription$,
      shop.keywords$,
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
}
