import { EMPTY, Observable, of, ReplaySubject } from "rxjs";
import { map, mergeMap, shareReplay, tap } from "rxjs/operators";
import { Progress, ShopConfigV1 } from "src/app/shared";
import { ItemsService } from "src/app/shop";
import { generateMerkleRootFromShop } from "src/app/shop/proof-generator";
import { ShopContractService } from "../blockchain/shop-contract.service";
import { FileClientFactory } from "../file-client/file-client-factory";
import { ShopError } from "../shop-error";
import { ProgressStage, UploadProgress, UploadService } from "../upload/upload.service";
import { ShopConfigUpdate, ShopService } from "./shop.service";

/**
 * This makes updating the shop harder when something here changes.
 * Consider only pushing shop data via the factory and updates get
 * directed against the factory so the shop information can be pushed
 * in one way.
 */
export class SmartContractShopService implements ShopService {
  identifier: string;
  smartContractAddress: string;
  shopName: string;
  shortDescription: string;
  description: string;
  keywords: string[];

  isAdmin$: Observable<boolean>;

  constructor(
    private readonly shopContractService: ShopContractService,
    private readonly fileClientFactory: FileClientFactory,
    private readonly uploadService: UploadService,
    identifier: string,
    smartContractAdresse: string,
    private readonly config: ShopConfigV1
  ) {
    console.log('Initialize Smart Contract based shop');

    this.identifier = identifier;
    this.smartContractAddress = smartContractAdresse;
    this.shopName = config.shopName;
    this.shortDescription = config.shortDescription;
    this.description = config.description;
    this.keywords = config.keywords;

    this.isAdmin$ = this.shopContractService.isAdmin(smartContractAdresse).pipe(shareReplay(1));
  }

  getNextItemIds(n: number): Observable<string[]> {
    throw new Error("Method not implemented.");
  }

  getItemService(): ItemsService {
    const items = this.config.itemUris;

    return new ItemsService(items, this.fileClientFactory);
  }

  shopBalance(): Observable<string> {
    return this.shopContractService.getBalance(this.smartContractAddress).pipe(
      shareReplay(1)
    );
  }

  withdraw(reveiverAddress: string): Observable<void> {
    return this.shopContractService.cashout(this.smartContractAddress, reveiverAddress);
  }

  addItemUri(itemUri: string) {
    this.config.itemUris.push(itemUri);
  }

  updateShopConfigAndRoot() {
    // Currently those are two TX, but can possibly unified in one TX to save gas.
  }

  updateItemsRoot(): Observable<Progress<void>> {
    return generateMerkleRootFromShop(this).pipe(
      tap(([itemsRoot, _]) => console.log('Calculated items root: ' + itemsRoot)),
      mergeMap(([itemsRoot]) => {
        return this.shopContractService.setItemsRoot(this.smartContractAddress, itemsRoot);
      }),
      map(_ => {
        return {
          progress: 50,
          text: 'Updating Shop contract with new configuration',
          result: null
        };
      })
    );
  }

  update(update: ShopConfigUpdate): Observable<Progress<void>> {
    const sub = new ReplaySubject<Progress<void>>(1);

    const updatedConfig = { ...this.config, ...update };
    const configData = JSON.stringify(updatedConfig);

    const updateShopConfig$ = this.uploadService.deployFiles(configData).pipe(
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
    updateShopConfig$.pipe(
      tap(() => {
        const progress: Progress<void> = {
          progress: 85,
          text: 'Updating Shop contract with new configuration',
          result: null
        };
        sub.next(progress);
      }),
      mergeMap(([configHash]) => {
        return this.shopContractService.setConfig(this.smartContractAddress, configHash)
      }),
      tap(() => {
        const progress: Progress<void> = {
          progress: 100,
          text: 'Shop successfully upated',
          result: null
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
  private toProgress(p: UploadProgress): Progress<void> {
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
      text: text,
      result: null
    }
  }
}