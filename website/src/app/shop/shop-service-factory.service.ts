import { Inject, Injectable } from "@angular/core";

import { combineLatest, Observable } from "rxjs";

import { ShopIdentifierService, SmartContractDetails } from "../core/shop/shop-identifier.service";
import { ShopService } from "./shop.service";
import { SmartContractShopService } from "./smart-contract-shop.service";
import { ShopContractService } from "../blockchain/shop-contract.service";
import { FileClientFactory } from "../core/file-client/file-client-factory";
import { UploadService } from "../blockchain/upload/upload.service";
import { map, mergeMap, shareReplay, tap } from "rxjs/operators";
import { ShopConfig, ShopConfigV1 } from "src/app/shared";
import { ShopError } from "../core/shop-error";
import { UriResolverService } from "../core/uri/uri-resolver.service";

import { FooterInfoUpdate, FooterService, NavService } from 'src/app/core';
import { PageMetaUpdaterService } from "../core/page-meta-updater.service";
import { UPLOAD_SERVICE_TOKEN } from "src/app/blockchain";

@Injectable({
  providedIn: 'root'
})
export class ShopServiceFactory {

  readonly shopService$: Observable<ShopService>;

  constructor(
    private readonly shopIdentifierService: ShopIdentifierService,
    private readonly shopContractService: ShopContractService,
    private readonly navService: NavService,
    private readonly uriResolverService: UriResolverService,
    private readonly fileClientFactory: FileClientFactory,
    private readonly footerService: FooterService,
    @Inject(UPLOAD_SERVICE_TOKEN) private readonly uploadService: UploadService,
    private readonly metaUpateService: PageMetaUpdaterService
  ) {
    this.shopService$ = this.shopIdentifierService.smartContractDetails$.pipe(
      mergeMap(details => this.buildSmartContractShopService(details)),
      tap(sc => this.updatePageMeta(sc)),
      tap(sc => this.updateFooter(sc)),
      tap(sc => this.updateNav(sc)),
      shareReplay(1)
    )
  }

  private buildSmartContractShopService(details: SmartContractDetails): Observable<ShopService> {
    const isAdmin$ = this.shopContractService.isAdmin(details.contractAddress);
    const shopConfig$ = this.shopContractService.getConfig(details.contractAddress).pipe(
      mergeMap(configUri => {
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

          return new SmartContractShopService(
            this.shopContractService,
            this.fileClientFactory,
            this.uriResolverService,
            this.uploadService,
            details.identifier,
            details.contractAddress,
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