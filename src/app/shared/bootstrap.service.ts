import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { Meta, MetaDefinition, Title } from '@angular/platform-browser';
import { Observable, from, ReplaySubject, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import CeramicClient from '@ceramicnetwork/http-client'

import { ShopConfig, ShopConfigV1 } from './model/shop-config';
import { environment } from './../../environments/environment';
import { ShopError } from './shop-error';
import { Collection } from './model/collection';


@Injectable({
  providedIn: 'root'
})
export class BootstrapService {

  private readonly ceramic = new CeramicClient(environment.ceramicApi);

  private config = new ReplaySubject<ShopConfig>(1);
  private isShopResolved = new BehaviorSubject(false);

  public readonly isShopResolved$: Observable<boolean> = this.isShopResolved.asObservable();
  // Not sure if this is the best pattern.
  public readonly config$: Observable<ShopConfig> = this.config.asObservable();
  public readonly configV1$: Observable<ShopConfigV1> = this.config$.pipe(
    map(x => x as ShopConfigV1)
  )

  constructor(
    private http: HttpClient,
    private meta: Meta,
    private titleService: Title,
  ) {
  }

  test() {
    const streamId = 'kjzl6cwe1jw1469zq1nurheflkosnma10dk0xzq0csveur0qo8be86czzsofcp0';
    return from(this.ceramic.loadStream(streamId)).pipe(
      map(x => x.content),
    )
  }

  private base64UrlDecode(x: string): string {
    let revertedString = x.replace('_', '/').replace('-', '+');
    switch (revertedString.length % 4) {
      case 2:
        revertedString += '==';
        break;
      case 3:
        revertedString += '=';
        break
    }

    return atob(revertedString);
  }

  /*
  private base64UrlEncode(x: string): string {
    let convertedString = btoa(x);
    return convertedString.replace('=', '').replace('+', '-').replace('/', '_');
  }
  */

  load(route: ActivatedRouteSnapshot) {
    const bootstrapEncoded = route.paramMap.get('bootstrap');
    if (bootstrapEncoded == null) {
      throw new ShopError('No bootstrap parameter in path');
    }

    const bootstrapDecoded = this.base64UrlDecode(bootstrapEncoded);

    if (bootstrapDecoded.startsWith('http://')) {
      // TODO later use strategy pattern to delegate to HttpBootstrapService
      this.getShopConfig(bootstrapDecoded).subscribe(c => {
        this.setupShop(c);
        this.config.next(c);
        this.isShopResolved.next(true);
      });
    }
  }

  private setupShop(config: ShopConfig) {
    if (config.version == "1") {
      const configV1 = config as ShopConfigV1;
      this.titleService.setTitle(configV1.shopName);

      const metaDefinitions: MetaDefinition[] = [
        { property: 'og:title', content: configV1.shopName },
        { property: 'og:description', content: configV1.description },
        { property: 'og:author', content: configV1.owner },
        { name: 'keywords', content: configV1.keywords.join(', ') },
        { property: 'og:type', content: 'website' },
      ];
      metaDefinitions.forEach(t => this.meta.updateTag(t));
    }
  }

  private getShopConfig(url: string): Observable<ShopConfig> {
    return this.http.get<ShopConfig>(url);
  }

  getCollections(): Observable<Collection> {
    return this.http.get<Collection>('/assets/collections.json');
  }
}
