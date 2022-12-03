import { Injectable } from '@angular/core';
import { BigNumber, ethers } from 'ethers';
import { combineLatest, from, Observable, throwError } from 'rxjs';
import { catchError, map, mergeMap, shareReplay, take, tap } from 'rxjs/operators';
import { ShopError } from '../core';
import { ContractService } from './contract.service';
import { handleProviderError } from './provider-errors';
import { ProviderService } from './provider.service';

@Injectable({
  providedIn: 'root'
})
export class ShopContractService extends ContractService {

  private static readonly W3Shop = {
    abi: [
      'function setItemsRoot(bytes32 _itemsRoot) external',
      'function getItemsRoot() public view returns (bytes32)',

      'function getBufferedItemIds() external view returns (uint256[] memory)',

      'function setConfig(string _shopConfig) external',
      'function getConfig() external view returns (string)',

      'function setConfigRoot(string memory _shopConfig, bytes32 _itemsRoot) external',

      'function isShopOwner(address _address) external view returns (bool)',

      'function setPaymentProcessor(address _paymentProcessor)',
      'function getPaymentProcessor() external view returns (address)',

      'function setItemUris(string[] calldata _uris, uint32[] calldata _maxAmounts)',

      'function closeShop() external',

      'function getPaymentReceiver() external view returns (address)',
      'function setPaymentReceiver(address _receiver) external'
    ],
  };

  constructor(
    providerService: ProviderService
  ) {
    super(providerService);
  }

  closeShop(contractAdress: string): Observable<void> {
    return this.getSignerContractOrThrow(
      contractAdress,
      ShopContractService.W3Shop.abi
    ).pipe(
      mergeMap(c => c.closeShop()),
      catchError(err => handleProviderError(err))
    ) as Observable<void>;
  }

  balanceOf(contractAdress: string): Observable<BigNumber> {
    return this.getProviderOrThrow().pipe(
      mergeMap(p => p.getBalance(contractAdress)),
      catchError(err => handleProviderError(err)),
      shareReplay(1)
    );
  }

  setConfigRoot(
    contractAddress: string,
    shopConfigUri: string,
    merkleRoot: string
  ): Observable<void> {
    if (!shopConfigUri.startsWith('ar://') && !shopConfigUri.startsWith('ipfs://')) {
      throw new ShopError(
        'Invalid contract data found',
        new Error(`Shop config URI ${shopConfigUri} did not start with either ar:// or ipfs://`)
      );
    }

    return this.getSignerContractOrThrow(
      contractAddress,
      ShopContractService.W3Shop.abi
    ).pipe(
      mergeMap(contract => {
        return from(contract.setConfigRoot(shopConfigUri, merkleRoot)) as Observable<void>;
      }),
      catchError(err => handleProviderError(err))
    );
  }

  getPaymentReceiver(contractAdress: string): Observable<string> {
    return this.getProviderContractOrThrow(
      contractAdress,
      ShopContractService.W3Shop.abi
    ).pipe(
      mergeMap(c => c.getPaymentReceiver()),
      catchError(err => handleProviderError(err))
    ) as Observable<string>;
  }

  setPaymentReceiver(contractAdress: string, paymentReceiverAddress: string): Observable<void> {
    if (!ethers.utils.isAddress(paymentReceiverAddress)) {
      return throwError(new ShopError(`${paymentReceiverAddress} is not a valid address`));
    }

    return this.getSignerContractOrThrow(
      contractAdress,
      ShopContractService.W3Shop.abi
    ).pipe(
      mergeMap(c => from(this.updatePaymentReceiver(c, paymentReceiverAddress))),
      catchError(err => handleProviderError(err))
    );
  }

  setItemUris(contractAdress: string, uris: string[], maxAmounts?: number[]): Observable<void> {
    if (!!maxAmounts && maxAmounts.length != uris.length) {
      throw new ShopError('Internal error occured', new Error('URIs and maxAmounts unequal length'));
    }

    if (uris.findIndex(uri => !uri.startsWith('ar://') && !uri.startsWith('ipfs://')) !== -1) {
      throw new ShopError(
        'Can not set the new item URI: invalid format',
        new Error('One or more URIs did not start with either ar:// or ipfs://')
      );
    }

    const filteredMaxAmounts = maxAmounts || Array(uris.length);

    return this.getSignerContractOrThrow(
      contractAdress,
      ShopContractService.W3Shop.abi
    ).pipe(
      mergeMap(c => c.setItemUris(uris, filteredMaxAmounts) as Observable<void>),
      catchError(err => handleProviderError(err))
    );
  }

  isAdmin(contractAdress: string): Observable<boolean> {
    const contract$ = this.getProviderContractOrThrow(
      contractAdress,
      ShopContractService.W3Shop.abi
    );

    return combineLatest([
      this.providerService.address$,
      contract$
    ]).pipe(
      mergeMap(([address, contract]) => {
        return from(contract.isShopOwner(address)) as Observable<boolean>;
      }),
      take(1),
      catchError(err => handleProviderError(err)),
      shareReplay(1)
    );
  }

  getConfig(contractAddress: string): Observable<string> {
    return this.getProviderContractOrThrow(
      contractAddress,
      ShopContractService.W3Shop.abi
    ).pipe(
      mergeMap(contract => contract.getConfig()),
      catchError(err => handleProviderError(err)),
      shareReplay(1)
    ) as Observable<string>;
  }

  setConfig(contractAddress: string, configUri: string): Observable<void> {
    return this.getSignerContractOrThrow(
      contractAddress,
      ShopContractService.W3Shop.abi
    ).pipe(
      mergeMap(contract => {
        return from(this.updateShopConfig(contract, configUri));
      }),
      catchError(err => handleProviderError(err))
    );
  }

  getItemsRoot(contractAddress: string): Observable<string> {
    return this.getProviderContractOrThrow(
      contractAddress,
      ShopContractService.W3Shop.abi
    ).pipe(
      mergeMap(contract => from(contract.getItemsRoot())),
      catchError(err => handleProviderError(err))
    ) as Observable<string>;
  }

  setItemsRoot(contractAddress: string, itemsRoot: string): Observable<void> {
    return this.getSignerContractOrThrow(
      contractAddress,
      ShopContractService.W3Shop.abi
    ).pipe(
      mergeMap(contract => {
        return from(this.updateItemsRoot(contract, itemsRoot));
      }),
      catchError(err => handleProviderError(err))
    );
  }

  getPaymentProcessor(contractAddress: string): Observable<string> {
    return this.getProviderContractOrThrow(
      contractAddress,
      ShopContractService.W3Shop.abi
    ).pipe(
      mergeMap(contract => from(contract.getPaymentProcessor())),
      catchError(err => handleProviderError(err))
    ) as Observable<string>;
  }

  getBufferedItemIds(contractAddress: string): Observable<string[]> {
    return this.getProviderContractOrThrow(
      contractAddress,
      ShopContractService.W3Shop.abi
    ).pipe(
      mergeMap(contract => contract.getBufferedItemIds()),
      map((bufferedIds: BigNumber[]) => bufferedIds.map(id => id.toString())),
      catchError(err => handleProviderError(err))
    );
  }

  prepareItem(contractAddress: string, itemId: BigNumber, uri: string): Observable<void> {
    return this.getSignerContractOrThrow(
      contractAddress,
      ShopContractService.W3Shop.abi
    ).pipe(
      mergeMap(contract => from(contract.prepareItem(itemId, uri))),
      tap(x => console.log(x)),
      mergeMap((tx: any) => from(tx.wait())),
      tap(x => console.log(x)),
      catchError(err => handleProviderError(err))
    ) as Observable<void>;
  }

  private async updatePaymentReceiver(contract: ethers.Contract, paymentReceiverAddress: string): Promise<void> {
    const tx = await contract.setPaymentReceiver(paymentReceiverAddress);
    await tx.wait();
  }

  private async updateShopConfig(contract: ethers.Contract, configId: string): Promise<void> {
    const tx = await contract.setConfig(configId);
    await tx.wait();
  }

  private async updateItemsRoot(contract: ethers.Contract, itemsRoot: string): Promise<void> {
    const tx = await contract.setItemsRoot(itemsRoot);
    await tx.wait();
  }
}