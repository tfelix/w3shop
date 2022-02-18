import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { Meta, MetaDefinition, Title } from '@angular/platform-browser';
import { Observable, ReplaySubject, BehaviorSubject, concat, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from './../../environments/environment';

import { Collection, sanitizeConfig, ShopConfig, ShopConfigV1, ShopError } from 'src/app/shared';
import { Base64CoderService } from './base64-coder.service';


@Injectable({
  providedIn: 'root'
})
export class BootstrapService {
  // private readonly ceramic = new CeramicClient(environment.ceramicApi);
  private config = new ReplaySubject<ShopConfig>(1);

  public readonly shopName$: Observable<string>

  private shopIdentifier = new BehaviorSubject<string>('');
  public readonly shopIdentifier$ = this.shopIdentifier.asObservable();
  public readonly isShopResolved$ = this.shopIdentifier$.pipe(
    map(x => x.length > 0)
  )

  // Not sure if this is the best pattern.
  public readonly config$: Observable<ShopConfig> = this.config.asObservable();
  public readonly configV1$: Observable<ShopConfigV1> = this.config$.pipe(
    map(x => x as ShopConfigV1)
  )

  constructor(
    private http: HttpClient,
    private meta: Meta,
    private titleService: Title,
    private readonly base64Service: Base64CoderService
  ) {
    this.shopName$ = concat(
      of(environment.defaultShopName),
      this.configV1$.pipe(
        map(x => x.shopName)
      )
    );
  }

  load(route: ActivatedRouteSnapshot) {
    const bootstrapEncoded = route.paramMap.get('bootstrap');
    if (bootstrapEncoded == null) {
      throw new ShopError('No bootstrap parameter in path');
    }

    const bootstrapDecoded = this.base64Service.base64UrlDecode(bootstrapEncoded);

    if (bootstrapDecoded.startsWith('http://')) {
      // TODO later use strategy pattern to delegate to HttpBootstrapService
      this.getShopConfig(bootstrapDecoded).subscribe(c => {
        const sc = sanitizeConfig(c);
        this.setupShop(sc);

        this.config.next(sc);
        this.config.complete();

        this.shopIdentifier.next(bootstrapEncoded);
        this.shopIdentifier.complete();
      });
    }
  }

  private setupShop(config: ShopConfig) {
    if (config.version == "1") {
      const configV1 = config as ShopConfigV1;
      this.titleService.setTitle(configV1.shopName);

      const metaDefinitions: MetaDefinition[] = [
        { property: 'og:title', content: configV1.shopName },
        { property: 'og:description', content: configV1.shortDescription },
        { property: 'og:author', content: configV1.owner },
        { name: 'keywords', content: configV1.keywords.join(', ') },
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
