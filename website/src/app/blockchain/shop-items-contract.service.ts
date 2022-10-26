import { Injectable } from "@angular/core";
import { BigNumber, ethers } from "ethers";
import { from, Observable } from "rxjs";
import { map, mergeMap } from "rxjs/operators";
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
      "function balanceOf(address account, uint256 id) public view returns (uint256)"
    ],
  };

  constructor(
    providerService: ProviderService
  ) {
    super(providerService);
  }

  getUri(contractAddress: string, itemId: BigNumber): Observable<string> {
    return this.getProviderContractOrThrow(
      contractAddress,
      ShopItemsContractService.W3ShopItems.abi
    ).pipe(
      mergeMap(p => from(p.uri(itemId)))
    ) as Observable<string>;
  }

  balanceOf(contractAddress: string, walletAddress: string, itemId: BigNumber): Observable<number> {
    return this.getProviderContractOrThrow(
      contractAddress,
      ShopItemsContractService.W3ShopItems.abi
    ).pipe(
      mergeMap(p => from(p.balanceOf(walletAddress, itemId)) as Observable<BigNumber>),
      map(balance => balance.toNumber())
    );
  }
}