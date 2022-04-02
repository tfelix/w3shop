import { Inject, Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { BehaviorSubject, Observable, ReplaySubject } from "rxjs";
import { map, mergeMap } from "rxjs/operators";
import { ShopConfig, ShopConfigV1 } from "src/app/shared";
import { ItemsService } from "src/app/shop";
import { SmartContractFacade } from "../contract/smart-contract-facade";
import { FileClientFactory } from "../file-client/file-client-factory";
import { ShopError } from "../shop-error";

// TODO This might be placed in the shop module instead
export interface ShopService {
  identifier$: Observable<string>;
  smartContract$: Observable<string>;
  shopName$: Observable<string>;
  shortDescription$: Observable<string>;
  description$: Observable<string>;
  keywords$: Observable<string[]>;
  isResolved$: Observable<boolean>;

  buildItemsService(): Observable<ItemsService>;

  update(config: ShopConfigV1): void;
}

@Injectable({
  providedIn: 'root'
})
export class SmartContractShopService implements ShopService {

  private configV1 = new ReplaySubject<ShopConfigV1>(1);
  private identifier = new ReplaySubject<string>(1);
  private smartContract = new ReplaySubject<string>(1);
  private isResolved = new BehaviorSubject<boolean>(false);

  identifier$: Observable<string> = this.identifier.asObservable();
  smartContract$: Observable<string> = this.smartContract.asObservable();
  isResolved$: Observable<boolean> = this.isResolved.asObservable();

  shopName$: Observable<string> = this.configV1.asObservable().pipe(map(c => c.shopName));
  shortDescription$: Observable<string> = this.configV1.asObservable().pipe(map(c => c.shortDescription));
  description$: Observable<string> = this.configV1.asObservable().pipe(map(c => c.description));
  keywords$: Observable<string[]> = this.configV1.asObservable().pipe(map(c => c.keywords));

  constructor(
    @Inject('SmartContract') private readonly smartContractFacade: SmartContractFacade,
    private readonly fileClientFactory: FileClientFactory,
    private readonly router: Router
  ) {
  }

  init(identifier: string, smartContractAdresse: string) {
    console.log('Initialize Smart Contract based shop');

    this.identifier.next(identifier);
    this.identifier.complete();
    this.smartContract.next(smartContractAdresse);
    this.smartContract.complete();

    // ask the SC for the current config file.
    this.smartContractFacade.getCurrentConfig(identifier).pipe(
      mergeMap(configUri => {
        const client = this.fileClientFactory.getResolver(configUri);
        return client.get<ShopConfig>(configUri);
      }),
    ).subscribe(shopConfig => {
      if (shopConfig.version === '1') {
        const shopConfigV1 = shopConfig as ShopConfigV1;
        this.configV1.next(shopConfigV1);
        this.configV1.complete();
        this.isResolved.next(true);
        this.isResolved.complete();
      } else {
        throw new ShopError('Unknown config version: ' + shopConfig.version);
      }
    }, err => {
      console.log('Error while initializing the shop', err);
      this.router.navigateByUrl('/');
    });
  }

  update(config: ShopConfigV1) {
    throw new Error("Method not implemented.");
  }

  buildItemsService(): Observable<ItemsService> {
    return this.configV1.asObservable().pipe(
      map(config => {
        const items = config.itemUris;
        return new ItemsService(items, this.fileClientFactory);
      })
    );
  }
}