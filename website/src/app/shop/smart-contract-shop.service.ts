import { Observable } from "rxjs";
import { map, mergeMap } from "rxjs/operators";
import { Progress, ShopConfigV1 } from "src/app/shared";
import { ItemsService } from "src/app/shop";
import { makeMerkleRoot } from "src/app/shop/proof-generator";
import { ShopContractService } from "../blockchain/shop-contract.service";
import { ShopConfigUpdate, ShopService } from "./shop.service";

import { BigNumber, ethers } from "ethers";
import { SmartContractConfigUpdateService } from "./smart-contract-config-update.service";
import { SmartContractDetails } from "src/app/core";

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

  close(): Observable<void> {
    return this.shopContractService.closeShop(this.smartContractAddress);
  }

  getNextItemIds(): Observable<string[]> {
    return this.shopContractService.getBufferedItemIds(this.smartContractAddress);
  }

  getItemService(): ItemsService {
    return this.itemService;
  }

  getPaymentReceiverBalance(): Observable<string> {
    return this.shopContractService.getPaymentReceiver(this.smartContractAddress).pipe(
      mergeMap(paymentReceiverAddress => this.shopContractService.balanceOf(paymentReceiverAddress)),
      map(balance => ethers.utils.formatEther(balance))
    );
  }

  getPaymentReceiver(): Observable<string> {
    return this.shopContractService.getPaymentReceiver(this.smartContractAddress);
  }

  setPaymentReceiver(receiverAddress: string): Observable<void> {
    return this.shopContractService.setPaymentReceiver(this.smartContractAddress, receiverAddress);
  }

  addItemUri(itemId: string, itemUri: string) {
    this.config.items[itemId] = itemUri;
  }

  updateShopConfigAndRoot(update: ShopConfigUpdate): Observable<Progress<void>> {
    return this.getMerkleRoot().pipe(
      mergeMap((merkleRoot) => this.configUpdateService.update(update, this.config, merkleRoot))
    );
  }

  updateItemsRoot(): Observable<void> {
    return this.getMerkleRoot().pipe(
      mergeMap((itemsRoot) => this.shopContractService.setItemsRoot(this.smartContractAddress, itemsRoot))
    );
  }

  updateShopConfig(update: ShopConfigUpdate): Observable<Progress<void>> {
    return this.configUpdateService.update(update, this.config);
  }
}