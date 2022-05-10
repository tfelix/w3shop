import { Inject, Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { ShopIdentifierService } from "./shop-identifier.service";
import { ShopService as ShopService } from "./shop.service";
import { SmartContractShopService } from "./smart-contract-shop.service";
import { ShopContractService } from "../blockchain/shop-contract.service";
import { FileClientFactory } from "../file-client/file-client-factory";
import { UploadService } from "../upload/upload.service";
import { BehaviorSubject, Observable } from "rxjs";

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

  private identifier: string | null = null;
  private cachedShopFacade: ShopService | null = null;

  private shopFacade = new BehaviorSubject<ShopService | null>(null);
  readonly shopService: Observable<ShopService | null> = this.shopFacade.asObservable();

  constructor(
    private readonly shopIdentifierService: ShopIdentifierService,
    private readonly shopContractService: ShopContractService,
    private readonly fileClientFactory: FileClientFactory,
    @Inject('Upload') private readonly uploadService: UploadService,
    private readonly router: Router
  ) { }

  init(identifier: string) {
    this.identifier = identifier;
  }

  build(): ShopService | null {
    if (this.cachedShopFacade) {
      return this.cachedShopFacade;
    }

    if (this.identifier === null) {
      return null;
    }

    if (this.identifier.length === 0) {
      // We still must build the placeholder service so Angular can inject it
      // properly. It just wont do anything useful.
      return null;
    }

    if (!this.shopIdentifierService.isSmartContractIdentifier(this.identifier)) {
      this.router.navigateByUrl('/');
      return null;
    }

    try {
      const shop = this.buildSmartContractShopService();
      this.cachedShopFacade = shop;

      return shop;
    } catch (e) {
      // It can fail in case the wallet is not connected or on the wrong network.
      return null;
    }
  }

  private buildSmartContractShopService(): ShopService {
    const details = this.shopIdentifierService.getSmartContractDetails(this.identifier);
    const scShopFacade = new SmartContractShopService(
      this.shopContractService,
      this.fileClientFactory,
      this.uploadService
    );
    scShopFacade.init(this.identifier, details.contractAddress);

    return scShopFacade;
  }
}