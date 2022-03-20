import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { Meta, MetaDefinition, Title } from '@angular/platform-browser';
import { Observable, ReplaySubject, BehaviorSubject, concat, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from './../../environments/environment';

import { Collection, ShopConfig, ShopConfigV1 } from 'src/app/shared';
import { Base64CoderService } from './base64-coder.service';
import { ShopError } from './shop-error';
import { DatabaseService } from './database/database';

function sanitizeConfig(c: ShopConfig): ShopConfig {
  if (c.version === '1') {
    const c1 = c as ShopConfigV1;
    return {
      ...c1,
      shopName: c1.shopName.slice(0, 50),
      shortDescription: c1.shortDescription.slice(0, 160)
    } as ShopConfig;
  } else {
    throw new ShopError('Unknown config version: ' + c.version);
  }
}

// Split this serivce into multiple services:
// - ConfigResolverService
// - PageSetupService (modifies header, footer etc. when config is loaded)
// - CollectionLoader / ItemLoader when item ids are used.
@Injectable({
  providedIn: 'root'
})
export class BootstrapService {
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
    private readonly base64Service: Base64CoderService,
    @Inject('Database') private databaseService: DatabaseService
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

    this.databaseService.loadShopConfig(bootstrapDecoded).subscribe(c => {
      const sc = sanitizeConfig(c);
      this.setupShop(sc);

      this.config.next(sc);
      this.config.complete();

      this.shopIdentifier.next(bootstrapEncoded);
      // When this completes, the URL in the route is not setup correctly anymore, but null is inserted.
      // this.shopIdentifier.complete();
    });
  }

  private setupShop(config: ShopConfig) {
    if (config.version === "1") {
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

  getCollections(): Observable<Collection> {
    return this.http.get<Collection>('/assets/collections.json');
  }
}
