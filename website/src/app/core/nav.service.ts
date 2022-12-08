import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { filterNotNull } from '../shared';
import { ShopDetailsBootService } from './shop-details-boot.service';

export interface NavShopInfo {
  shortDescription: string;
  contractAddr: string;
  isAdmin: boolean;
}

export interface NavInfo {
  shopName: string;
  shop: NavShopInfo | null;
  shopIdentifier: string | null;
  wallet: {
    connectedAddress: string;
  } | null;
};

@Injectable({
  providedIn: 'root'
})
export class NavService {

  private currentNavInfo: NavInfo = this.defaultInfo();
  private navInfoUpdate = new BehaviorSubject<NavInfo>(this.currentNavInfo);

  navInfo$: Observable<NavInfo> = this.navInfoUpdate.asObservable();

  constructor(
    private readonly shopBootService: ShopDetailsBootService
  ) {
    this.shopBootService.shopDetails$.pipe(
      filterNotNull()
    ).subscribe(sd => this.updateShopIdentifier(sd.identifier));
  }

  private defaultInfo(): NavInfo {
    return {
      shopName: environment.defaultShopName,
      shop: null,
      wallet: null,
      shopIdentifier: null
    };
  }

  updateShop(shopName: string, shop: NavShopInfo | null) {
    this.currentNavInfo = { ...this.currentNavInfo, shopName, shop };
    this.navInfoUpdate.next(this.currentNavInfo);
  }

  private updateShopIdentifier(shopIdentifier: string | null) {
    this.currentNavInfo = { ...this.currentNavInfo, shopIdentifier };
    this.navInfoUpdate.next(this.currentNavInfo);
  }
}