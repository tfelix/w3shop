import { BehaviorSubject, EMPTY, forkJoin, Observable, of, ReplaySubject } from "rxjs";
import { map, mergeMap, shareReplay, tap } from "rxjs/operators";
import { Progress, ShopConfig, ShopConfigV1 } from "src/app/shared";
import { ItemsService } from "src/app/shop";
import { generateMerkleRootFromShop } from "src/app/shop/proof-generator";
import { ShopContractService } from "../blockchain/shop-contract.service";
import { FileClientFactory } from "../file-client/file-client-factory";
import { ShopError } from "../shop-error";
import { ProgressStage, UploadProgress, UploadService } from "../upload/upload.service";
import { ShopConfigUpdate, ShopService } from "./shop.service";

export class SmartContractShopService implements ShopService {

  private configV1 = new ReplaySubject<ShopConfigV1>(1);
  private identifier = new ReplaySubject<string>(1);
  private smartContractSub = new ReplaySubject<string>(1);
  private isResolved = new BehaviorSubject<boolean>(false);

  identifier$: Observable<string> = this.identifier.asObservable();
  smartContractAddress$: Observable<string> = this.smartContractSub.asObservable();
  isResolved$: Observable<boolean> = this.isResolved.asObservable();

  private readonly configV1Obs = this.configV1.asObservable();
  shopName$: Observable<string> = this.configV1Obs.pipe(map(c => c.shopName));
  shortDescription$: Observable<string> = this.configV1Obs.pipe(map(c => c.shortDescription));
  description$: Observable<string> = this.configV1Obs.pipe(map(c => c.description));
  keywords$: Observable<string[]> = this.configV1Obs.pipe(map(c => c.keywords));

  shopBalance$: Observable<string> = this.smartContractAddress$.pipe(
    mergeMap(addr => this.shopContractService.getBalance(addr)),
    shareReplay(1)
  );

  items$ = this.configV1Obs.pipe(
    map(config => {
      const items = config.itemUris;
      return new ItemsService(items, this.fileClientFactory);
    }),
    shareReplay(1)
  );

  isAdmin$: Observable<boolean>;

  constructor(
    private readonly shopContractService: ShopContractService,
    private readonly fileClientFactory: FileClientFactory,
    private readonly uploadService: UploadService,
  ) {
  }

  init(identifier: string, smartContractAdresse: string) {
    console.log('Initialize Smart Contract based shop');

    this.identifier.next(identifier);
    this.identifier.complete();
    this.smartContractSub.next(smartContractAdresse);
    this.smartContractSub.complete();

    this.isAdmin$ = this.shopContractService.isAdmin(smartContractAdresse);

    // FIXME this throws if the user is on the wrong network. Find a way to catch this error and show an indicator that
    //   the user is on the wrong network.
    this.shopContractService.getConfig(smartContractAdresse).pipe(
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
    });
  }

  withdraw(reveiverAddress: string): Observable<void> {
    return this.smartContractAddress$.pipe(
      mergeMap(contractAddr => this.shopContractService.cashout(contractAddr, reveiverAddress))
    )
  }

  update(update: ShopConfigUpdate): Observable<Progress> {
    const sub = new ReplaySubject<Progress>(1);

    const updateShopConfigObs = this.configV1Obs.pipe(
      map(c => ({ ...c, ...update })),
      mergeMap(updatedConfig => {
        const configData = JSON.stringify(updatedConfig);
        return this.uploadService.deployFiles(configData);
      }),

      tap(up => {
        // This is normed to 85%, to have some room left for the contract update.
        up.progress = Math.ceil(up.progress / 100.0 * 80);
        sub.next(this.toProgress(up));
      }),
      mergeMap(up => {
        if (up.fileId) {
          return of(up.fileId);
        } else {
          return EMPTY;
        }
      })
    );

    // Update the shop contract with the new item root and config
    forkJoin([
      updateShopConfigObs,
      this.smartContractAddress$,
      generateMerkleRootFromShop(this)
    ]).pipe(
      tap(() => {
        const progress: Progress = {
          progress: 85,
          text: 'Updating Shop contract with new configuration'
        };
        sub.next(progress);
      }),
      mergeMap(([configHash, contractAddr, calculatedItemRoot]) => {
        return this.shopContractService.setConfig(contractAddr, configHash, calculatedItemRoot)
      }),
      tap(() => {
        const progress: Progress = {
          progress: 100,
          text: 'Shop successfully upated'
        };
        sub.next(progress);
      }),
    ).subscribe(
      () => { },
      (err) => {
        throw new ShopError('Updating the shop config failed', err);
      }
    );

    return sub.asObservable();
  }

  // TODO This can be unified with the shop creation if the progress component
  //   is used there too.
  private toProgress(p: UploadProgress): Progress {
    let text = '';
    switch (p.stage) {
      case ProgressStage.SIGN_IN:
        text = 'Please sign into the Bundlr network to start the upload';
        break;
      case ProgressStage.FUND:
        text = 'Bundlr must be funded in order to continue with the upload';
        break;
      case ProgressStage.UPLOAD:
        text = 'Uploading files...';
        break;
      case ProgressStage.COMPLETE:
        text = 'File upload complete';
        break;
      default:
        text = 'Unknown';
        break;
    }

    return {
      progress: p.progress,
      text: text
    }
  }
}