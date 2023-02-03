import { Injectable } from '@angular/core';
import { merge, Observable, of, Subject } from 'rxjs';
import { NetworkService } from 'src/app/core';

export interface FooterInfo {
  factoryContractAddr: string;
  shopName: string;
  shop: {
    shopContractAddress: string;
    shortDescription: string;
  } | null;
}

export interface FooterInfoUpdate {
  shopContractAddress: string;
  shortDescription: string;
  shopName: string;
}

@Injectable({
  providedIn: 'root'
})
export class FooterService {

  private readonly footerInfoUpdateSubject = new Subject<FooterInfo>();
  footerInfo$: Observable<FooterInfo>;

  private readonly defaultFooterInfo: FooterInfo;

  constructor(
    private readonly networkService: NetworkService
  ) {
    this.defaultFooterInfo = this.getDefaultFooterInfo();

    this.footerInfo$ = merge(
      of(this.defaultFooterInfo),
      this.footerInfoUpdateSubject.asObservable()
    );
  }

  private getDefaultFooterInfo(): FooterInfo {
    const network = this.networkService.getExpectedNetwork();

    return {
      factoryContractAddr: network.shopFactoryContract,
      shopName: '',
      shop: null
    };
  }

  updateFooterInfo(update: FooterInfoUpdate) {
    const newFooterInfo: FooterInfo = {
      ...this.defaultFooterInfo,
      shopName: update.shopName,
      shop: {
        shopContractAddress: update.shopContractAddress,
        shortDescription: update.shortDescription
      }
    };

    this.footerInfoUpdateSubject.next(newFooterInfo);
  }
}