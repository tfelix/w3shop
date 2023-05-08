import { Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { ShopConfig, ShopConfigV1 } from 'src/app/shared';
import { ItemsService } from 'src/app/shop';
import { ShopService } from './shop.service';

import { ethers, formatEther } from 'ethers';

import { ShopContractService, ProviderService } from 'src/app/blockchain';
import { ShopError, SmartContractDetails } from 'src/app/core';

/**
 * This makes updating the shop harder when something here changes.
 * Consider only pushing shop data via the factory and updates get
 * directed against the factory so the shop information can be pushed
 * in one way.
 *
 * Being force to include the configUpdateService here that could otherwise be placed in the admin module only
 * also leads to a certain bloat in the shop-module which should be avoided.
 */
export class SmartContractShopService implements ShopService {
  identifier: string;
  smartContractAddress: string;
  shopName: string;
  shortDescription: string;
  description: string;
  keywords: string[];

  constructor(
    private readonly providerService: ProviderService,
    private readonly shopContractService: ShopContractService,
    private readonly itemService: ItemsService,
    details: SmartContractDetails,
    public readonly isAdmin: boolean,
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

  getConfig(): ShopConfig {
    return this.config;
  }


  transferOwnership(newOwner: string): Observable<void> {
    return this.providerService.address$.pipe(
      map(addr => {
        if (!addr) {
          throw new ShopError('Can not transfer show owenershop: address is null');
        }

        return addr;
      }),
      mergeMap(currentAddress => this.shopContractService.transferFrom(this.smartContractAddress, currentAddress, newOwner, 0, 1))
    );
  }

  close(): Observable<void> {
    return this.shopContractService.closeShop(this.smartContractAddress);
  }

  getNextItemIds(): Observable<string[]> {
    // We call just the next ID and add up to 5 more IDs, so we can directly
    // generate up to 5 more item IDs (all numbers going up are supposed to be unused)
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
      map(balance => formatEther(balance))
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

  // TODO maybe combine this with addItemUri?
  /**
   * This adds a item to the shop. It wont trigger any update procedure to the underlying
   * data. You need to call updateItemsConfigAndRoot if you are done adding items.
   */
  addItem(itemId: string, itemDataUri: string) {
    this.config.items[itemId] = itemDataUri;
    this.getItemService().addItem(itemId, itemDataUri);
  }
}