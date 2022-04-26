import { Component, OnInit } from '@angular/core';
import { Meta, MetaDefinition, Title } from '@angular/platform-browser';
import { forkJoin } from 'rxjs';
import { ShopService, ShopServiceFactory } from './core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  constructor(
    private readonly shopFactory: ShopServiceFactory,
    private meta: Meta,
    private titleService: Title,
  ) {
  }

  ngOnInit(): void {
    const shop = this.shopFactory.build();
    if (shop !== null) {
      this.setupPage(shop);
    }
  }

  private setupPage(shop: ShopService) {
    forkJoin([
      shop.shopName$,
      shop.shortDescription$,
      shop.keywords$,
    ]).subscribe(([shopName, desc, keywords]) => {
      this.titleService.setTitle(`${shopName} - ${desc}`);

      const metaDefinitions: MetaDefinition[] = [
        { property: 'og:title', content: shopName },
        { property: 'og:description', content: desc },
        { name: 'keywords', content: keywords.join(', ') },
      ];
      metaDefinitions.forEach(t => this.meta.updateTag(t));
    });
  }
}
