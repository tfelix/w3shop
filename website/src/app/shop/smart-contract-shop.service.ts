import { EMPTY, Observable, of, ReplaySubject } from "rxjs";
import { map, mergeMap, shareReplay, tap } from "rxjs/operators";
import { Progress, ShopConfigV1 } from "src/app/shared";
import { ItemsService } from "src/app/shop";
import { makeMerkleRoot } from "src/app/shop/proof-generator";
import { ShopContractService } from "../blockchain/shop-contract.service";
import { ShopConfigUpdate, ShopService } from "./shop.service";

import { UriResolverService, FileClientFactory, ShopError } from "src/app/core";
import { ProgressStage, UploadProgress, UploadService } from "src/app/blockchain";
import { formatEther } from "ethers/lib/utils";
import { BigNumber } from "ethers";

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
  isAdmin: boolean;

  private itemService: ItemsService;

  constructor(
    private readonly shopContractService: ShopContractService,
    private readonly fileClientFactory: FileClientFactory,
    private readonly uriResolver: UriResolverService,
    private readonly uploadService: UploadService,
    identifier: string,
    smartContractAdresse: string,
    isAdmin: boolean,
    private readonly config: ShopConfigV1
  ) {
    console.log('Initialize Smart Contract based shop');

    this.identifier = identifier;
    this.smartContractAddress = smartContractAdresse;
    this.shopName = config.shopName;
    this.shortDescription = config.shortDescription;
    this.description = config.description;
    this.keywords = config.keywords;
    this.isAdmin = isAdmin;

    this.itemService = new ItemsService(
      this.config.currency,
      this.config.items,
      this.uriResolver,
      this.fileClientFactory
    );
  }

  getMerkleRoot(): Observable<string | null> {
    return this.getItemService().getItems().pipe(
      map(items => {
        if (items.length === 0) {
          return null;
        }

        const itemIds = items.map(i => BigNumber.from(i.id));
        const itemPrices = items.map(i => BigNumber.from(i.price.amount));

        return makeMerkleRoot(itemIds, itemPrices);
      })
    );
  }

  getNextItemIds(n: number): Observable<string[]> {
    throw new Error("Method not implemented.");
  }

  getItemService(): ItemsService {
    return this.itemService;
  }

  shopBalance(): Observable<string> {
    return this.shopContractService.balanceOf(this.smartContractAddress).pipe(
      map(x => formatEther(x)),
      shareReplay(1)
    );
  }

  withdraw(reveiverAddress: string): Observable<void> {
    return this.shopContractService.cashout(this.smartContractAddress, reveiverAddress);
  }

  addItemUri(itemId: string, itemUri: string) {
    this.config.items[itemId] = itemUri;
  }

  updateShopConfigAndRoot() {
    throw new Error('Not implemented');
    // Currently those are two TX, but can possibly unified in one TX to save gas.
  }

  updateItemsRoot(): Observable<void> {
    return this.getMerkleRoot().pipe(
      mergeMap((itemsRoot) => this.shopContractService.setItemsRoot(this.smartContractAddress, itemsRoot))
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