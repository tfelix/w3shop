import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ProviderService, ShopContractService } from "src/app/blockchain";
import { SmartContractShopService } from "./smart-contract-shop.service";

/**
 * Can be used to tell if you are an admin or not.
 */
@Injectable({
  providedIn: 'root'
})
export class ShopAdminService {

  isAdmin$: Observable<boolean>;

  constructor(
    private readonly providerService: ProviderService,
    private readonly test: ShopContractService
  ) {
    providerService.address$
    test.isAdmin()
  }
}