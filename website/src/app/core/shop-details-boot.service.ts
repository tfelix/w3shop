import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { ShopIdentifierService, SmartContractDetails } from './shop/shop-identifier.service';

/**
 * The central bootstrap service. If a shop details object can be generated this must be fed into
 * this service from which all the bootstrapping will start.
 */
@Injectable({
  providedIn: 'root'
})
export class ShopDetailsBootService {

  private shopDetails = new BehaviorSubject<SmartContractDetails | null>(null);
  public readonly shopDetails$ = this.shopDetails.asObservable();
  public readonly hasShopDetails$ = this.shopDetails$.pipe(map(x => x !== null));

  constructor(
    private readonly shopIdentifierService: ShopIdentifierService
  ) { }

  registerShopIdentifier(encodedShopIdentifier: string) {
    const details = this.shopIdentifierService.getSmartContractDetails(encodedShopIdentifier);
    this.shopDetails.next(details);
  }
}