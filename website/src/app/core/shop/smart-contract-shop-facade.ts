import { BehaviorSubject, EMPTY, Observable, ReplaySubject } from "rxjs";
import { map, mergeMap, tap } from "rxjs/operators";
// FIXME Core should not import shared. Either move model to core or this service to shop <- probably better.
import { Progress, ShopConfig, ShopConfigV1 } from "src/app/shared";
import { ItemsService } from "src/app/shop";
import { ShopContractService } from "../blockchain/shop-contract.service";
import { FileClientFactory } from "../file-client/file-client-factory";
import { ShopError } from "../shop-error";
import { ProgressStage, UploadProgress, UploadService } from "../upload/upload.service";
import { ShopConfigUpdate, ShopService } from "./shop-facade";

export class SmartContractShopFacade implements ShopService {

  private configV1 = new ReplaySubject<ShopConfigV1>(1);
  private identifier = new ReplaySubject<string>(1);
  private smartContractAdresse: string;
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
    this.smartContractAdresse = smartContractAdresse;
    this.smartContractSub.next(smartContractAdresse);
    this.smartContractSub.complete();

    this.isAdmin$ = this.shopContractService.isAdmin(this.smartContractAdresse);

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

  update(update: ShopConfigUpdate): Observable<Progress> {
    const sub = new ReplaySubject<Progress>(1);

    this.configV1Obs.pipe(
      map(c => ({ ...c, ...update })),
      mergeMap(updatedConfig => {
        const configData = JSON.stringify(updatedConfig);
        return this.uploadService.deployFiles(configData);
      }),
      tap(up => sub.next(up)),
      map(up => {
        if (up.fileId) {
          return up.fileId;
        } else {
          return EMPTY;
        }
      })
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

  buildItemsService(): Observable<ItemsService> {
    return this.configV1Obs.pipe(map(config => {
      const items = config.itemUris;
      return new ItemsService(items, this.fileClientFactory);
    }));
  }
}