import { Inject, Injectable } from "@angular/core";

import { combineLatest, Observable, Subject } from "rxjs";

import { ShopService } from "./shop.service";
import { SmartContractShopService } from "./smart-contract-shop.service";
import { ShopContractService } from "../blockchain/shop-contract.service";
import { FileClientFactory } from "../core/file-client/file-client-factory";
import { UploadService } from "../blockchain/upload/upload.service";
import { map, mergeMap, shareReplay, take, tap } from "rxjs/operators";
import { ShopConfigV1 } from "src/app/shared";
import { ShopError } from "../core/shop-error";
import { UriResolverService } from "../core/uri/uri-resolver.service";

import {
  FooterInfoUpdate, FooterService, NavService, PageMetaUpdaterService,
  ScopedLocalStorage, SmartContractDetails
} from 'src/app/core';
import { UPLOAD_SERVICE_TOKEN } from "src/app/blockchain";
import { ItemsService } from "./items/items.service";
import { SmartContractConfigUpdateService } from "./smart-contract-config-update.service";
import { Router } from "@angular/router";

@Injectable({
  providedIn: 'root'
})
export class ShopServiceFactory {

  private smartContractDetails: SmartContractDetails;
  private shopService$: Observable<ShopService>;

  constructor(
    private readonly shopContractService: ShopContractService,
    private readonly navService: NavService,
    private readonly uriResolverService: UriResolverService,
    private readonly fileClientFactory: FileClientFactory,
    private readonly footerService: FooterService,
    @Inject(UPLOAD_SERVICE_TOKEN) private readonly uploadService: UploadService,
    private readonly metaUpateService: PageMetaUpdaterService,
    private readonly localStorageService: ScopedLocalStorage,
    private readonly router: Router
  ) {
  }

  setSmartContractDetails(details: SmartContractDetails) {
    this.smartContractDetails = details;
  }

  getShopService(): Observable<ShopService> {
    if (!this.shopService$) {
      this.shopService$ = this.buildSmartContractShopService(this.smartContractDetails).pipe(
        tap(sc => this.updatePageMeta(sc)),
        tap(sc => this.updateFooter(sc)),
        tap(sc => this.updateNav(sc)),
        shareReplay(1),
        take(1)
      );

      // TODO Maybe subscribe to directly update footer, meta and nav?
    }

    return this.shopService$;
  }

  private buildSmartContractShopService(details: SmartContractDetails): Observable<ShopService> {
    const isAdmin$ = this.shopContractService.isAdmin(details.contractAddress);
    const shopConfig$ = this.shopContractService.getConfig(details.contractAddress).pipe(
      mergeMap(configUri => {
        console.log('Found URI:' + configUri);
        const client = this.fileClientFactory.getResolver(configUri);
        return client.get<string>(configUri);
      }),
      map(body => JSON.parse(body))
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
            this.uriResolverService,
            this.fileClientFactory
          );

          const configUpdateService = new SmartContractConfigUpdateService(
            details.contractAddress,
            this.uploadService,
            this.shopContractService,
            this.localStorageService,
            this.router
          );

          return new SmartContractShopService(
            this.shopContractService,
            configUpdateService,
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

  private updateFooter(shopService: ShopService) {
    const update: FooterInfoUpdate = {
      shopContractAddress: shopService.smartContractAddress,
      shortDescription: shopService.shortDescription,
      shopName: shopService.shopName
    }
    this.footerService.updateFooterInfo(update);
  }

  private updateNav(shopService: ShopService) {
    this.navService.updateShop(
      shopService.shopName,
      {
        shortDescription: shopService.shortDescription,
        contractAddr: shopService.smartContractAddress,
        isAdmin: shopService.isAdmin,
      });
  }
}