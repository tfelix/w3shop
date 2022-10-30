import { Injectable } from "@angular/core";
import { BigNumber, Contract, ethers } from "ethers";
import { forkJoin, from, Observable } from "rxjs";
import { catchError, map, mergeMap, shareReplay, tap } from "rxjs/operators";
import { Multiproof } from "src/app/shop/proof-generator";
import { environment } from "src/environments/environment";
import { ContractService } from "./contract.service";
import { handleProviderError } from "./provider-errors";
import { ProviderService } from "./provider.service";

@Injectable({
  providedIn: 'root'
})
export class ShopContractService extends ContractService {

  private static readonly W3Shop = {
    abi: [
      // "function setItemsRoot(bytes32 _itemsRoot) public",


      // "function cashout(address receiver) public",
      // "function closeShop(address receiver) public",

      // "function setConfigRoot(string memory _shopConfig, bytes32 _itemsRoot) public",

      // "function getItemsRoot() public view returns (bytes32)",

      // "function getBufferedItemIds() public view returns (uint256[] memory)",

      "function setConfig(string _shopConfig) public",
      "function getConfig() public view returns (string)",

      // "function setPaymentProcessor(address _paymentProcessor)",
      // "function getPaymentProcessor() public view returns (address)"
    ],
  };

  constructor(
    providerService: ProviderService
  ) {
    super(providerService);
  }

  private makeShopContract(
    contractAddress: string,
    provider: ethers.providers.Provider | ethers.Signer
  ): Contract {
    return new ethers.Contract(contractAddress, ShopContractService.W3Shop.abi, provider);
  }

  isAdmin(contractAdresse: string): Observable<boolean> {
    return forkJoin([
      this.providerService.address$,
      this.providerService.provider$
    ]).pipe(
      map(([address, provider]) => {
        if (!provider) {
          return false;
        }
        console.log(address);
        const contract = this.makeShopContract(contractAdresse, provider);

        // return contract.balanceOf(address, 0) as Observable<BigNumber>;
        return true;
      }),
      shareReplay(1)
    );
  }

  cashout(contractAddress: string, receiverAddr: string): Observable<void> {
    return this.getSignerContractOrThrow(
      contractAddress,
      ShopContractService.W3Shop.abi
    ).pipe(
      mergeMap(c => from(c.cashout(receiverAddr)) as Observable<any>),
      mergeMap(tx => from(tx.wait()) as Observable<void>),
      catchError(err => handleProviderError(err))
    );
  }

  buy(
    contractAddress: string,
    amounts: BigNumber[],
    prices: BigNumber[],
    itemIds: BigNumber[],
    proof: Multiproof
  ): Observable<void> {
    const totalPrice = prices.map(p => BigNumber.from(p))
      .reduce((a, b) => a.add(b));

    if (!environment.production) {
      const itemIdsNum = itemIds.map(x => x.toBigInt());
      const amountsNum = amounts.map(x => x.toBigInt());
      const totalPriceNum = totalPrice.toBigInt();
      console.log(`Buying items ${itemIdsNum} with amounts ${amountsNum}, total price: ${totalPriceNum}`);
    }

    return this.getSignerContractOrThrow(
      contractAddress,
      ShopContractService.W3Shop.abi
    ).pipe(
      mergeMap(contract => {
        return from(contract.buy(amounts, prices, itemIds, proof.proof, proof.proofFlags, {
          value: totalPrice,
        }));
      }),
      mergeMap((tx: any) => from(tx.wait())),
      catchError(err => handleProviderError(err))
    ) as Observable<void>;
  }

  getItemsRoot(contractAddress: string): Observable<string> {
    return this.getProviderContractOrThrow(
      contractAddress,
      ShopContractService.W3Shop.abi
    ).pipe(
      mergeMap(contract => from(contract.getItemsRoot())),
    ) as Observable<string>;
  }

  getConfig(contractAddress: string): Observable<string> {
    return this.getProviderContractOrThrow(
      contractAddress,
      ShopContractService.W3Shop.abi
    ).pipe(
      mergeMap(contract => contract.getConfig()),
      shareReplay(1)
    ) as Observable<string>;
  }

  setConfig(contractAddress: string, configId: string): Observable<void> {
    return this.getSignerContractOrThrow(
      contractAddress,
      ShopContractService.W3Shop.abi
    ).pipe(
      mergeMap(contract => {
        return from(this.updateShopConfig(contract, configId));
      }),
    );
  }

  setItemsRoot(contractAddress: string, itemsRoot: string): Observable<void> {
    return this.getSignerContractOrThrow(
      contractAddress,
      ShopContractService.W3Shop.abi
    ).pipe(
      mergeMap(contract => {
        return from(this.updateItemsRoot(contract, itemsRoot));
      })
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

  private async updateShopConfig(contract: ethers.Contract, configId: string): Promise<void> {
    const tx = await contract.setConfig(configId);
    await tx.wait();
  }

  private async updateItemsRoot(contract: ethers.Contract, itemsRoot: string): Promise<void> {
    const tx = await contract.setItemsRoot(itemsRoot);
    await tx.wait();
  }
}