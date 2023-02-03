import { Inject, Injectable } from '@angular/core';

import { combineLatest, Observable } from 'rxjs';

import { ShopService } from './shop.service';
import { SmartContractShopService } from './smart-contract-shop.service';
import { ShopContractService } from '../blockchain/shop-contract.service';
import { catchError, distinctUntilChanged, map, mergeMap, share, shareReplay, take, tap } from 'rxjs/operators';
import { filterNotNull, ShopConfig, ShopConfigV1 } from 'src/app/shared';
import { ShopError } from '../core/shop-error';

import {
  FooterInfoUpdate, FooterService, NavService, PageMetaUpdaterService,
  ScopedLocalStorage, ShopDetailsBootService, SmartContractDetails, UriResolverService
} from 'src/app/core';
import { FileClientFactory, ProviderService } from 'src/app/blockchain';
import { ItemsService } from './items/items.service';
import { SmartContractConfigUpdateService } from './smart-contract-config-update.service';
import { UploadService, UPLOAD_SERVICE_TOKEN } from 'src/app/updload';

export class ShopCreationException extends ShopError {
  constructor(public cause?: Error) {
    super('Cloud not access the shop', cause);
  }
}

@Injectable({
  providedIn: 'root'
})
export class ShopServiceFactory {

  private smartContractDetails: SmartContractDetails;
  private shopService$: Observable<ShopService>;

  isUserOnCorrectNetwork$: Observable<boolean> = combineLatest([
    this.bootService.shopDetails$,
    this.providerService.isWalletConnected$,
    this.providerService.chainId$
  ]).pipe(
    map(([details, isWalletConnected, chainId]) => isWalletConnected && details.chainId === chainId),
    distinctUntilChanged(),
    shareReplay(1),
  );

  constructor(
    private readonly shopContractService: ShopContractService,
    private readonly navService: NavService,
    private readonly fileClientFactory: FileClientFactory,
    private readonly footerService: FooterService,
    @Inject(UPLOAD_SERVICE_TOKEN) private readonly uploadService: UploadService,
    private readonly metaUpateService: PageMetaUpdaterService,
    private readonly localStorageService: ScopedLocalStorage,
    private readonly uriResolver: UriResolverService,
    private readonly bootService: ShopDetailsBootService,
    private readonly providerService: ProviderService
  ) {
    this.bootService.shopDetails$.pipe(
      filterNotNull()
    ).subscribe(sd => this.setSmartContractDetails(sd));
  }

  private setSmartContractDetails(details: SmartContractDetails) {
    this.smartContractDetails = details;
  }

  getShopService(): Observable<ShopService> {
    if (!this.shopService$) {
      this.shopService$ = this.buildSmartContractShopService(this.smartContractDetails).pipe(
        tap(sc => this.updatePageMeta(sc)),
        tap(sc => this.updateFooter(sc)),
        tap(sc => this.updateNav(sc)),
        shareReplay(1),
        take(1),
        catchError(err => {
          throw new ShopCreationException(err);
        })
      );
    }

    return this.shopService$;
  }

  private buildSmartContractShopService(details: SmartContractDetails): Observable<ShopService> {
    const isAdmin$ = this.shopContractService.isAdmin(details.contractAddress);
    const shopConfig$ = this.shopContractService.getConfig(details.contractAddress).pipe(
      mergeMap(configUri => {
        const client = this.fileClientFactory.getResolver(configUri);
        // A parsing is not required because the content type is set to application/json
        return client.get<ShopConfig>(configUri);
      }),
      tap(config => console.log('Loaded shop config: ', config)),
      share()
    );

    return combineLatest([
      isAdmin$,
      shopConfig$
    ]).pipe(
      map(([isAdmin, shopConfig]) => {
        if (shopConfig.version === '1') {
          // TODO maybe introduce a sanity check that actually checks/verifies all fields that
          // are coming in for security reasons. And don't just assume its a valid JSON.
          const shopConfigV1 = shopConfig as ShopConfigV1;

          const itemService = new ItemsService(
            shopConfigV1.currency,
            shopConfigV1.items,
            this.fileClientFactory,
            this.uriResolver
          );

          const configUpdateService = new SmartContractConfigUpdateService(
            details.contractAddress,
            this.uploadService,
            this.shopContractService,
            this.localStorageService,
          );

          return new SmartContractShopService(
            this.shopContractService,
            configUpdateService,
            itemService,
            details,
            isAdmin,
            this.uploadService,
            shopConfigV1
          );
        } else {
          throw new ShopError('Unknown config version: ' + shopConfig.version);
        }
      })
    );
  }

  private updatePageMeta(shopService: ShopService) {
    this.metaUpateService.updatePageMeta({
      shopName: shopService.shopName,
      shortDescription: shopService.shortDescription,
      keywords: shopService.keywords
    });
  }

  private updateFooter(shopService: ShopService) {
    const update: FooterInfoUpdate = {
      shopContractAddress: shopService.smartContractAddress,
      shortDescription: shopService.shortDescription,
      shopName: shopService.shopName
    };
    this.footerService.updateFooterInfo(update);
  }

  private updateNav(shopService: ShopService) {
    this.navService.updateShop(
      shopService.shopName,
      {
        shortDescription: shopService.shortDescription,
        contractAddr: shopService.smartContractAddress,
        isAdmin: shopService.isAdmin,
      }
    );
  }
}