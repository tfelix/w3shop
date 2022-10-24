import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";

export interface NavInfo {
  shopIdentifier: string;
  contractAddr: string;
  isAdmin: boolean;
  shopName: string;
  shortDescription: string;
  isShopResolved: boolean;
  wallet: {
    connectedAddress: string;
  } | null;
};


@Injectable({
  providedIn: 'root'
})
export class NavService {

  navInfo$: Observable<NavInfo> = of();

  constructor() {
    console.log('Nav Service');
  }
}