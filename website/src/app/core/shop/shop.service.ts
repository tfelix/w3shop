import { Inject, Injectable } from "@angular/core";
import { BehaviorSubject, Observable, of, ReplaySubject } from "rxjs";
import { map, mergeMap } from "rxjs/operators";
import { ShopConfig, ShopConfigV1 } from "src/app/shared";
import { SmartContractFacade } from "../contract/smart-contract-facade";
import { FileClientFactory } from "../file-client/file-client-factory";
import { ShopError } from "../shop-error";

export interface ShopService {
  identifier$: Observable<string>;
  smartContract$: Observable<string>;
  shopName$: Observable<string>;
  shortDescription$: Observable<string>;
  description$: Observable<string>;
  keywords$: Observable<string[]>;
  isResolved$: Observable<boolean>;

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
    private readonly fileClientFactory: FileClientFactory
  ) {
  }


  init(identifier: string) {
    // FIXME we also need the encoded identifier here...
    this.identifier.next(identifier);
    this.identifier.complete();
    this.smartContract.next(identifier);
    this.smartContract.complete();

    // per definition this is the smart contract id
    this.smartContract$ = of(identifier);

    // ask the SC for the current config file.
    this.smartContractFacade.getCurrentConfig(identifier).pipe(
      mergeMap(configUri => {
        const client = this.fileClientFactory.getResolver(configUri);
        return client.get<ShopConfig>(configUri);
      }),
      map(shopConfig => {
        if (shopConfig.version === '1') {
          const shopConfigV1 = shopConfig as ShopConfigV1;
          this.configV1.next(shopConfigV1);
          this.configV1.complete();
          this.isResolved.next(true);
          this.isResolved.complete();
        } else {
          throw new ShopError('Unknown config version: ' + shopConfig.version);
        }
      })
    )
  }

  update(config: ShopConfigV1) {
    throw new Error("Method not implemented.");
  }
}