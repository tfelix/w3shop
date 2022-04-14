import { Router } from "@angular/router";
import { BehaviorSubject, Observable, of, ReplaySubject } from "rxjs";
import { map, mergeMap } from "rxjs/operators";
import { ShopConfig, ShopConfigV1 } from "src/app/shared";
import { ItemsService } from "src/app/shop";
import { ShopContractService } from "../blockchain/shop-contract.service";
import { FileClientFactory } from "../file-client/file-client-factory";
import { ShopError } from "../shop-error";
import { ShopFacade } from "./shop-facade";

export class SmartContractShopFacade implements ShopFacade {

  private configV1 = new ReplaySubject<ShopConfigV1>(1);
  private identifier = new ReplaySubject<string>(1);
  private smartContractAdresse: string;
  private smartContractSub = new ReplaySubject<string>(1);
  private isResolved = new BehaviorSubject<boolean>(false);

  identifier$: Observable<string> = this.identifier.asObservable();
  smartContractAddress$: Observable<string> = this.smartContractSub.asObservable();
  isResolved$: Observable<boolean> = this.isResolved.asObservable();

  shopName$: Observable<string> = this.configV1.asObservable().pipe(map(c => c.shopName));
  shortDescription$: Observable<string> = this.configV1.asObservable().pipe(map(c => c.shortDescription));
  description$: Observable<string> = this.configV1.asObservable().pipe(map(c => c.description));
  keywords$: Observable<string[]> = this.configV1.asObservable().pipe(map(c => c.keywords));

  constructor(
    private readonly shopContractService: ShopContractService,
    private readonly fileClientFactory: FileClientFactory,
    private readonly router: Router
  ) {
  }

  init(identifier: string, smartContractAdresse: string) {
    console.log('Initialize Smart Contract based shop');

    this.identifier.next(identifier);
    this.identifier.complete();
    this.smartContractAdresse = smartContractAdresse;
    this.smartContractSub.next(smartContractAdresse);
    this.smartContractSub.complete();

    // FIXME this throws if the user is on the wrong network. Find a way to catch this error and show an indicator that
    //   the user is on the wrong network.
    this.shopContractService.getCurrentConfig(smartContractAdresse).pipe(
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

  isAdmin(): Observable<boolean> {
    return this.shopContractService.isAdmin(this.smartContractAdresse)
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