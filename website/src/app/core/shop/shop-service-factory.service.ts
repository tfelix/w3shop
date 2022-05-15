import { Inject, Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { ShopIdentifierService, SmartContractDetails } from "./shop-identifier.service";
import { ShopService as ShopService } from "./shop.service";
import { SmartContractShopService } from "./smart-contract-shop.service";
import { ShopContractService } from "../blockchain/shop-contract.service";
import { FileClientFactory } from "../file-client/file-client-factory";
import { UploadService } from "../upload/upload.service";
import { BehaviorSubject, combineLatest, concat, forkJoin, Observable, of } from "rxjs";
import { map, mergeMap, shareReplay, tap } from "rxjs/operators";
import { ShopConfig, ShopConfigV1 } from "src/app/shared";
import { ShopError } from "../shop-error";

/**
 * This feels in general quite hacky. Check if there is better way on how to build
 * this shop, based on the identifier found during load.
 * TODO Maybe this whole code flow logic can be improved a bit and be less brittle. A lof
 *   of setup works happens right at the "bootup" stage. Would be better if a lot of logic
 *   would be postponed.
 */
@Injectable({
  providedIn: 'root'
})
export class ShopServiceFactory {

  readonly shopService$: Observable<ShopService | null>;

  constructor(
    private readonly shopIdentifierService: ShopIdentifierService,
    private readonly shopContractService: ShopContractService,
    private readonly fileClientFactory: FileClientFactory,
    @Inject('Upload') private readonly uploadService: UploadService,
  ) {

    const scDetails$ = this.shopIdentifierService.identifier$.pipe(
      tap(identifier => this.checkIdentifierValidity(identifier)),
      map(identifier => this.shopIdentifierService.getSmartContractDetails(identifier))
    );

    const shopService$ = combineLatest([
      scDetails$,
      this.shopIdentifierService.identifier$
    ]).pipe(
      mergeMap(([details, identifier]) => this.buildSmartContractShopService(details, identifier)),
    );

    this.shopService$ = concat(
      of(null),
      shopService$
    ).pipe(
      shareReplay(1)
    );
  }

  private checkIdentifierValidity(identifier: string) {
    if (identifier.length === 0) {
      // We still must build the placeholder service so Angular can inject it
      // properly. It just wont do anything useful.
      return;
    }

    if (!this.shopIdentifierService.isSmartContractIdentifier(identifier)) {
      throw new ShopError('The shop identifier is not valid, the shop can not be displayed');
    }
  }

  private buildSmartContractShopService(details: SmartContractDetails, identifier: string): Observable<ShopService> {
    // FIXME this throws if the user is on the wrong network. Find a way to catch this error and show an indicator that
    //   the user is on the wrong network.
    return this.shopContractService.getConfig(details.contractAddress).pipe(
      mergeMap(configUri => {
        const client = this.fileClientFactory.getResolver(configUri);
        return client.get<ShopConfig>(configUri);
      }),
      map(shopConfig => {
        if (shopConfig.version === '1') {
          const shopConfigV1 = shopConfig as ShopConfigV1;

          return new SmartContractShopService(
            this.shopContractService,
            this.fileClientFactory,
            this.uploadService,
            identifier,
            details.contractAddress,
            shopConfigV1
          );
        } else {
          throw new ShopError('Unknown config version: ' + shopConfig.version);
        }
      })
    );
  }
}