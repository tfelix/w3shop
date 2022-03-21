import { Inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { Observable, ReplaySubject, concat, of, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../environments/environment';

import { base64UrlDecode, ShopConfig, ShopConfigV1 } from 'src/app/shared';
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

@Injectable({
  providedIn: 'root'
})
export class ConfigResolverService {
  private config = new ReplaySubject<ShopConfig>(1);
  private identifier = new ReplaySubject<string>(1);
  private isResolved = new BehaviorSubject(false);

  public readonly shopName$: Observable<string>;
  public readonly identifier$ = this.identifier.asObservable();
  public readonly isResolved$ = this.isResolved.asObservable();
  public readonly config$: Observable<ShopConfig> = this.config.asObservable();
  public readonly configV1$: Observable<ShopConfigV1> = this.config$.pipe(
    map(x => x as ShopConfigV1)
  );

  constructor(
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

    const bootstrapDecoded = base64UrlDecode(bootstrapEncoded);

    this.databaseService.loadShopConfig(bootstrapDecoded).subscribe(c => {
      const sc = sanitizeConfig(c);

      this.config.next(sc);
      this.config.complete();

      this.isResolved.next(true);
      this.isResolved.complete();

      this.identifier.next(bootstrapEncoded);
      this.identifier.complete();
    });
  }
}
