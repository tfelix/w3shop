import { Injectable } from "@angular/core";
import { base64UrlDecode } from "src/app/shared";
import { ShopError } from "../shop-error";
import { NullShopService } from "./null-shop.service";
import { ShopService, SmartContractShopService } from "./shop.service";


@Injectable({
  providedIn: 'root'
})
export class ShopServiceFactory {

  private identifier: string | null = null;

  constructor(
    private readonly smartContractShopService: SmartContractShopService
  ) { }

  init(identifier: string) {
    this.identifier = identifier;
  }

  build(): ShopService {
    if (this.identifier === null || this.identifier.length === 0) {
      console.debug('Shop was not resolved. Creating placeholder service');
      return new NullShopService();
    }

    const decoded = base64UrlDecode(this.identifier);

    console.debug('Decoded shop identifier: ' + decoded);

    if (decoded.startsWith('sc:')) {
      return this.buildSmartContractShopService(decoded.slice(3));
    } else {
      throw new ShopError('Unknown identifier scheme: ' + decoded);
    }
  }

  private buildSmartContractShopService(chainPrefixedAddresse: string): ShopService {
    if (!chainPrefixedAddresse.startsWith('4:')) {
      throw new ShopError('Unknown chain id in identifier: ' + chainPrefixedAddresse);
    }

    const smartContractAddr = chainPrefixedAddresse.slice(2);

    this.smartContractShopService.init(this.identifier, smartContractAddr);

    return this.smartContractShopService;
  }
}