import { Injectable } from "@angular/core";
import { merge, Observable, of, Subject } from "rxjs";
import { shareReplay, tap } from "rxjs/operators";
import { environment } from "src/environments/environment";

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

export interface NavInfoUpdate {
  shop: null;
}

@Injectable({
  providedIn: 'root'
})
export class NavService {

  private currentNavInfo: NavInfo;
  private navInfoUpdate = new Subject<NavInfo>();

  navInfo$: Observable<NavInfo>;

  constructor() {
    const update$ = this.navInfoUpdate.asObservable();
    this.navInfo$ = merge(
      of(this.defaultInfo()),
      update$
    ).pipe(
      tap(x => this.currentNavInfo = x),
      shareReplay(1)
    );
  }

  private defaultInfo(): NavInfo {
    return {
      shopName: environment.defaultShopName,
      shop: null,
      wallet: null,
      shopIdentifier: null
    };
  }

  updateShop(shop: NavShopInfo | null) {
    this.navInfoUpdate.next({ ...this.currentNavInfo, shop });
  }

  updateShopIdentifier(shopIdentifier: string | null) {
    this.navInfoUpdate.next({ ...this.currentNavInfo, shopIdentifier });
  }
}