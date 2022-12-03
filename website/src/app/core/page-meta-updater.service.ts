import { Injectable } from '@angular/core';
import { Meta, MetaDefinition, Title } from '@angular/platform-browser';

export interface PageMetaUpdate {
  shopName: string;
  shortDescription: string;
  keywords: string[];
}

@Injectable({
  providedIn: 'root'
})
export class PageMetaUpdaterService {

  constructor(
    private meta: Meta,
    private titleService: Title,
  ) {
  }

  updatePageMeta(update: PageMetaUpdate) {
    this.titleService.setTitle(`${update.shopName} - ${update.shortDescription}`);

    const metaDefinitions: MetaDefinition[] = [
      { property: 'og:title', content: update.shopName },
      { property: 'og:description', content: update.shortDescription },
      { name: 'keywords', content: update.keywords.join(', ') },
    ];
    metaDefinitions.forEach(t => this.meta.updateTag(t));

  }
}