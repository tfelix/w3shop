import { forkJoin, Observable } from 'rxjs';
import { map, mergeMap, pluck, shareReplay, tap } from 'rxjs/operators';
import { filterNotNull, Progress, ShopConfigV1 } from 'src/app/shared';
import { ItemsService } from 'src/app/shop';
import { ShopContractService } from '../blockchain/shop-contract.service';
import { ShopConfigUpdate, ShopService } from './shop.service';

import { ethers } from 'ethers';
import { SmartContractConfigUpdateService } from './smart-contract-config-update.service';

import { SmartContractDetails } from 'src/app/core';
import { UploadService } from 'src/app/updload';

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

  constructor(
    private readonly shopContractService: ShopContractService,
    private readonly configUpdateService: SmartContractConfigUpdateService,
    private readonly itemService: ItemsService,
    details: SmartContractDetails,
    public readonly isAdmin: boolean,
    private readonly uploadService: UploadService,
    private readonly config: ShopConfigV1
  ) {
    console.log('Initialize Shop by Smart Contract');

    this.identifier = details.identifier;
    this.smartContractAddress = details.contractAddress;
    this.shopName = config.shopName;
    this.shortDescription = config.shortDescription;
    this.description = config.description;
    this.keywords = config.keywords;
  }

  close(): Observable<void> {
    return this.shopContractService.closeShop(this.smartContractAddress);
  }

  getNextItemIds(): Observable<string[]> {
    const ds = [0, 1, 2, 3, 4];

    return this.shopContractService.getNextItemId(this.smartContractAddress).pipe(
      map(nextId => ds.map(d => nextId.add(d).toString()))
    );
  }

  getItemService(): ItemsService {
    return this.itemService;
  }

  getPaymentReceiverBalance(): Observable<string> {
    return this.shopContractService.getPaymentReceiver(this.smartContractAddress).pipe(
      mergeMap(paymentReceiverAddress => this.shopContractService.etherBalanceOf(paymentReceiverAddress)),
      map(balance => ethers.utils.formatEther(balance))
    );
  }

  getPaymentReceiver(): Observable<string> {
    return this.shopContractService.getPaymentReceiver(this.smartContractAddress);
  }

  setPaymentReceiver(receiverAddress: string): Observable<void> {
    return this.shopContractService.setPaymentReceiver(this.smartContractAddress, receiverAddress);
  }

  addItemUri(itemUri: string): Observable<void> {
    return this.shopContractService.prepareItems(this.smartContractAddress, itemUri, 0);
  }

  getItemUri(itemId: string): Observable<string> {
    return this.shopContractService.uri(this.smartContractAddress, itemId);
  }

  getItemBalance(itemId: string): Observable<number> {
    return this.shopContractService.balanceOf(this.smartContractAddress, itemId).pipe(
      map(x => x.toNumber())
    );
  }

  // TODO cleanup the update methods and consolidate them into a better API.
  updateShopConfigAndRoot(update: ShopConfigUpdate): Observable<Progress<void>> {
    return this.configUpdateService.update(update, this.config);
  }

  updateItemsRoot(): Observable<void> {
    return this.getItemService().getMerkleRoot().pipe(
      mergeMap((itemsRoot) => this.shopContractService.setItemsRoot(this.smartContractAddress, itemsRoot))
    );
  }

  updateShopConfig(update: ShopConfigUpdate): Observable<Progress<void>> {
    // This is not a good design as changes are not immediately reflected in the
    // shops data. This shops config should get updated.
    return this.configUpdateService.update(update, this.config);
  }

  // TODO maybe combine this with addItemUri?
  /**
   * This adds a item to the shop. It wont trigger any update procedure to the underlying
   * data. You need to call updateItemsConfigAndRoot if you are done adding items.
   */
  addItem(itemId: string, itemDataUri: string) {
    this.config.items[itemId] = itemDataUri;
    this.getItemService().addItem(itemId, itemDataUri);
  }

  /**
   * When the shop items have changed this calculates the new merkle root, generates
   * a proper shop config, uploads both via the upload service and then updates the
   * smart contract.
   */
  updateItemsConfigAndRoot(): Observable<void> {
    const updatedShopConfig = JSON.stringify(this.config);

    const updatedConfigUri$ = this.uploadService.uploadJson(updatedShopConfig).pipe(
      pluck('fileId'),
      filterNotNull(),
      shareReplay(1),
      tap(x => console.log('Uploaded shop config:', x))
    );
    const merkleRoot$ = this.getItemService().getMerkleRoot();

    return forkJoin([
      updatedConfigUri$,
      merkleRoot$
    ]).pipe(
      mergeMap(([configUri, merkleRoot]) => {
        return this.shopContractService.setConfigRoot(
          this.smartContractAddress,
          configUri,
          merkleRoot
        );
      })
    );
  }
}