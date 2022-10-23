import { Inject, Injectable } from "@angular/core";
import { ShopIdentifierService, SmartContractDetails } from "./shop-identifier.service";
import { ShopService } from "./shop.service";
import { SmartContractShopService } from "./smart-contract-shop.service";
import { ShopContractService } from "../blockchain/shop-contract.service";
import { FileClientFactory } from "../file-client/file-client-factory";
import { UploadService } from "../upload/upload.service";
import { concat, Observable, of } from "rxjs";
import { map, mergeMap, shareReplay } from "rxjs/operators";
import { ShopConfig, ShopConfigV1 } from "src/app/shared";
import { ShopError } from "../shop-error";
import { TOKEN_UPLOAD } from "../inject-tokens";
import { UriResolverService } from "../uri/uri-resolver.service";

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
    private readonly uriResolverService: UriResolverService,
    private readonly fileClientFactory: FileClientFactory,
    @Inject(TOKEN_UPLOAD) private readonly uploadService: UploadService,
  ) {

    this.shopService$ = concat(
      of(null),
      this.shopIdentifierService.smartContractDetails$.pipe(
        mergeMap(details => this.buildSmartContractShopService(details)),
      )
    ).pipe(
      shareReplay(1)
    );
  }

  private buildSmartContractShopService(details: SmartContractDetails): Observable<ShopService> {
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
            this.uriResolverService,
            this.uploadService,
            details.identifier,
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