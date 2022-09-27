import { Injectable } from "@angular/core";
import { BigNumber, ethers } from "ethers";
import { combineLatest, from, Observable } from "rxjs";
import { map, mergeMap, shareReplay, take } from "rxjs/operators";
import { ContractService } from "./contract.service";
import { ProviderService } from "./provider.service";

// FIXME Move this to the shop module
@Injectable({
  providedIn: 'root'
})
export class ShopItemsContractService extends ContractService {

  private static readonly W3ShopItems = {
    abi: [
      "function uri(uint256 id) external view returns (string)",
      "function balanceOf(uint256 owner) external view returns (uint256)",
    ],
  };

  constructor(
    providerService: ProviderService
  ) {
    super(providerService);
  }

  isAdmin(contractAdresse: string): Observable<boolean> {
    return combineLatest([
      this.providerService.address$,
      this.getProviderContractOrThrow(contractAdresse, ShopItemsContractService.W3ShopItems.abi)
    ]).pipe(
      take(1),
      mergeMap(([address, contract]) => contract.balanceOf(address, 0) as Observable<BigNumber>),
      map(balance => balance.gt(0)),
      shareReplay(1)
    );
  }

  getUri(contractAddress: string, itemId: BigNumber): Observable<string> {
    return this.getProviderOrThrow().pipe(
      map(p => this.makeShopContract(contractAddress, p)),
      mergeMap(p => from(p.uri(itemId)))
    ) as Observable<string>;
  }

  getBalance(contractAddress: string): Observable<string> {
    return this.getProviderOrThrow().pipe(
      mergeMap(p => from(p.getBalance(contractAddress))),
      map(balance => ethers.utils.formatEther(balance)),
    );
  }
}