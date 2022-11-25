import { Injectable } from "@angular/core";
import { BigNumber } from "ethers";
import { from, Observable } from "rxjs";
import { map, mergeMap } from "rxjs/operators";
import { ContractService } from "./contract.service";
import { ProviderService } from "./provider.service";

import { NetworkService } from "src/app/core";

@Injectable({
  providedIn: 'root'
})
export class ShopItemsContractService extends ContractService {

  private static readonly W3ShopItems = {
    abi: [
      "function uri(uint256 id) external view returns (string)",
      "function balanceOf(address account, uint256 id) public view returns (uint256)"
    ],
  };

  private shopItemsContractAddr: string;

  constructor(
    providerService: ProviderService,
    networkService: NetworkService
  ) {
    super(providerService);

    this.shopItemsContractAddr = networkService.getExpectedNetwork().shopItemsContract;
  }

  getUri(tokenId: string): Observable<string> {
    const itemIdNum = BigNumber.from(tokenId);

    return this.getProviderContractOrThrow(
      this.shopItemsContractAddr,
      ShopItemsContractService.W3ShopItems.abi
    ).pipe(
      mergeMap(p => p.uri(itemIdNum))
    ) as Observable<string>;
  }

  balanceOf(walletAddress: string, itemId: BigNumber): Observable<number> {
    return this.getProviderContractOrThrow(
      this.shopItemsContractAddr,
      ShopItemsContractService.W3ShopItems.abi
    ).pipe(
      mergeMap(p => from(p.balanceOf(walletAddress, itemId)) as Observable<BigNumber>),
      map(balance => balance.toNumber())
    );
  }
}