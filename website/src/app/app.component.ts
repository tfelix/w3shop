import { Component, OnInit } from '@angular/core';
import { Meta, MetaDefinition, Title } from '@angular/platform-browser';
import { filter, take } from 'rxjs/operators';
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
    this.shopFactory.shopService$.pipe(
      filter(x => !!x),
      take(1)
    ).subscribe(shop => this.setupPage(shop))
  }

  private setupPage(shop: ShopService) {
    this.titleService.setTitle(`${shop.shopName} - ${shop.shortDescription}`);

    const metaDefinitions: MetaDefinition[] = [
      { property: 'og:title', content: shop.shopName },
      { property: 'og:description', content: shop.shortDescription },
      { name: 'keywords', content: shop.keywords.join(', ') },
    ];
    metaDefinitions.forEach(t => this.meta.updateTag(t));

  }
}
