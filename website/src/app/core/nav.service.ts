import { Injectable } from "@angular/core";
import { merge, Observable, of, Subject } from "rxjs";
import { shareReplay } from "rxjs/operators";
import { environment } from "src/environments/environment";

export interface NavInfo {
  shopName: string;
  shop: {
    shopIdentifier: string;
    shortDescription: string;
    contractAddr: string;
    isAdmin: boolean;
  } | null;
  wallet: {
    connectedAddress: string;
  } | null;
};

export interface NavInfoUpdate {

}


@Injectable({
  providedIn: 'root'
})
export class NavService {

  private shopInfoUpdate = new Subject<NavInfo>();

  navInfo$: Observable<NavInfo>;

  constructor() {
    this.navInfo$ = merge(
      of(this.defaultInfo()),
      this.shopInfoUpdate.asObservable()
    ).pipe(shareReplay(1));
  }

  private defaultInfo(): NavInfo {
    return {
      shopName: environment.defaultShopName,
      shop: null,
      wallet: null
    };
  }

  update(data: NavInfoUpdate | null) {
    if (data == null) {
      this.shopInfoUpdate.next(this.defaultInfo());
    } else {
      // do stuff
    }
  }
}