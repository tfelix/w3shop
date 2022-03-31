import { Inject, Injectable } from "@angular/core";
import { Meta, MetaDefinition, Title } from "@angular/platform-browser";
import { concat, Observable, of } from "rxjs";
import { map } from "rxjs/operators";

import { environment } from "src/environments/environment";

import { ShopConfig, ShopConfigV1 } from "src/app/shared";
import { ShopService } from "./shop/shop.service";

@Injectable({
  providedIn: 'root'
})
export class PageSetupService {
  public readonly shopName$: Observable<string>;
  public readonly shopIdentifier$: Observable<string>;

  constructor(
    private meta: Meta,
    private titleService: Title,
    @Inject('Shop') private shopService: ShopService
  ) {
    this.shopName$ = concat(
      of(environment.defaultShopName),
      this.shopService.shopName$
    );

    this.shopIdentifier$ = shopService.shopName$;
  }

  private setupShop(config: ShopConfig) {
    if (config.version === "1") {
      const configV1 = config as ShopConfigV1;
      this.titleService.setTitle(configV1.shopName);

      const metaDefinitions: MetaDefinition[] = [
        { property: 'og:title', content: configV1.shopName },
        { property: 'og:description', content: configV1.shortDescription },
        { name: 'keywords', content: configV1.keywords.join(', ') },
      ];
      metaDefinitions.forEach(t => this.meta.updateTag(t));
    }
  }
}
