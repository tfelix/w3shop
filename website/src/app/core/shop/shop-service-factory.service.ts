import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
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
    private readonly smartContractShopService: SmartContractShopService,
    private readonly router: Router
  ) { }

  init(identifier: string) {
    this.identifier = identifier;
  }

  build(): ShopService {
    if (this.identifier === null) {
      // Our app makes sure that if there is a somewhat valid shop identifier
      // it sets it until this method is called. If so far no valid identifier
      // was found, we can assume the URL is faulty and can redirect to the home.
      console.error('Shop was not resolved, can not create ShopService, redirecting to home instead');
      this.router.navigateByUrl('/');
      // We still must build the placeholder service so Angular can inject it
      // properly. It just wont do anything useful.
      return new NullShopService();
    }

    if (this.identifier.length === 0) {
      // We still must build the placeholder service so Angular can inject it
      // properly. It just wont do anything useful.
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