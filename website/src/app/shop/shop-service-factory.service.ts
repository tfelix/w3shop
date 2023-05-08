import { Injectable } from '@angular/core';

import { combineLatest, Observable } from 'rxjs';

import { ShopService } from './shop.service';
import { SmartContractShopService } from './smart-contract-shop.service';
import { ShopContractService } from '../blockchain/shop-contract.service';
import { catchError, distinctUntilChanged, map, mergeMap, share, shareReplay, take, tap } from 'rxjs/operators';
import { filterNotNull, ShopConfig, ShopConfigV1 } from 'src/app/shared';
import { ShopError } from '../core/shop-error';

import {
  NavService, PageMetaUpdaterService, ShopDetailsBootService, SmartContractDetails, UriResolverService
} from 'src/app/core';
import { FileClientFactory, ProviderService } from 'src/app/blockchain';
import { ItemsService } from './items/items.service';

export class ShopCreationException extends ShopError {
  constructor(public override cause?: Error) {
    super('Could not access the shop', cause);
  }
}

@Injectable({
  providedIn: 'root'
})
export class ShopServiceFactory {

  private smartContractDetails: SmartContractDetails | null = null;
  private shopService$!: Observable<ShopService>;

  isUserOnCorrectNetwork$: Observable<boolean> = combineLatest([
    this.bootService.shopDetails$,
    this.providerService.isWalletConnected$,
    this.providerService.chainId$
  ]).pipe(
    map(([details, isWalletConnected, chainId]) => isWalletConnected && (!!details && details.chainId === chainId)),
    distinctUntilChanged(),
    shareReplay(1),
  );

  constructor(
    private readonly shopContractService: ShopContractService,
    private readonly navService: NavService,
    private readonly fileClientFactory: FileClientFactory,
    private readonly metaUpateService: PageMetaUpdaterService,
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
      if (!this.smartContractDetails) {
        throw new ShopError('Can not generate Shop, missing smart contract details');
      }
      this.shopService$ = this.buildSmartContractShopService(this.smartContractDetails).pipe(
        tap(sc => this.updatePageMeta(sc)),
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

          return new SmartContractShopService(
            this.providerService,
            this.shopContractService,
            itemService,
            details,
            isAdmin,
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