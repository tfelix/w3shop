import { Observable } from 'rxjs';

import { ItemsService } from './items/items.service';
import { ShopConfig } from '../shared';

export interface ShopConfigUpdate {
  shopName: string;
  shortDescription: string;
  description: string;
  keywords: string[];
}

export interface ShopService {
  identifier: string;
  smartContractAddress: string;
  shopName: string;
  shortDescription: string;
  description: string;
  keywords: string[];
  isAdmin: boolean;

  getItemService(): ItemsService;

  getConfig(): ShopConfig;

  /**
   * Reserves the next item IDs. With a central registry we need to reserve this
   * as its unclear which IDs the contract with give us.
   */
  getNextItemIds(): Observable<string[]>;

  getPaymentReceiverBalance(): Observable<string>;
  getPaymentReceiver(): Observable<string>;
  setPaymentReceiver(receiverAddress: string): Observable<void>;

  addItemUri(itemUri: string): Observable<void>;
  getItemUri(itemId: string): Observable<string>;

  getItemBalance(itemId: string): Observable<number>;

  /**
   * Closes the shop permanently.
   */
  close(): Observable<void>;

  /**
   * Transfers the shop ownership to a new address.
   */
  transferOwnership(newOwner: string): Observable<void>;
}