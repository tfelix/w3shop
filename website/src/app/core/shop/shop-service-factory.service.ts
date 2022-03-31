import { Injectable } from "@angular/core";
import { base64decode } from "../base64";
import { ShopError } from "../shop-error";
import { ShopService, SmartContractShopService } from "./shop.service";


@Injectable({
  providedIn: 'root'
})
export class ShopServiceFactory {

  private identifier: string | null;

  constructor(
    private readonly smartContractShopService: SmartContractShopService
  ) { }

  init(identifier: string) {
    this.identifier = identifier;
  }

  build(): ShopService {
    if (this.identifier === null) {
      throw new ShopError('ShopServiceFactory was not initialized. Call init() first.');
    }

    const decoded = base64decode(this.identifier);
    if (decoded.startsWith('sc:')) {
      return this.buildSmartContractShopService(decoded.slice(3));
    } else {
      throw new ShopError('Unknown identifier scheme: ' + decoded);
    }

  }

  private buildSmartContractShopService(identifier: string): ShopService {
    if (!identifier.startsWith('4:')) {
      throw new ShopError('Unknown chain id in identifier: ' + identifier);
    }

    const smartContractAddr = identifier.slice(2);

    this.smartContractShopService.init(smartContractAddr);

    return this.smartContractShopService;
  }
}