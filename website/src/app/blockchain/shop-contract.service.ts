import { Injectable } from "@angular/core";
import { BigNumber, ethers } from "ethers";
import { combineLatest, from, Observable, of, throwError } from "rxjs";
import { catchError, map, mergeMap, shareReplay, take, tap } from "rxjs/operators";
import { ShopError } from "../core";
import { ContractService } from "./contract.service";
import { handleProviderError } from "./provider-errors";
import { ProviderService } from "./provider.service";

@Injectable({
  providedIn: 'root'
})
export class ShopContractService extends ContractService {

  private static readonly W3Shop = {
    abi: [
      // "function closeShop(address receiver) public",
      // "function setConfigRoot(string memory _shopConfig, bytes32 _itemsRoot) public",

      "function setItemsRoot(bytes32 _itemsRoot) external",
      "function getItemsRoot() public view returns (bytes32)",

      "function getBufferedItemIds() external view returns (uint256[] memory)",

      "function setConfig(string _shopConfig) external",
      "function getConfig() external view returns (string)",
      "function setConfigRoot(string memory _shopConfig, bytes32 _itemsRoot) external",
      "function isShopOwner(address _address) external view returns (bool)",

      "function setPaymentProcessor(address _paymentProcessor)",
      "function getPaymentProcessor() external view returns (address)",

      "function closeShop() external",

      "function getPaymentReceiver() external view returns (address)",
      "function setPaymentReceiver(address _receiver) external"
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

  isAdmin(contractAdress: string): Observable<boolean> {
    const contract$ = this.getProviderContractOrThrow(
      contractAdress,
      ShopContractService.W3Shop.abi
    )

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