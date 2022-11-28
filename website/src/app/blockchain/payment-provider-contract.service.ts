import { Injectable } from "@angular/core";
import { BigNumber } from "ethers";
import { from, Observable } from "rxjs";
import { catchError, mergeMap } from "rxjs/operators";
import { ContractService } from "./contract.service";
import { handleProviderError } from "./provider-errors";
import { ProviderService } from "./provider.service";

@Injectable({
  providedIn: 'root'
})
export class PaymentProcessorContractService extends ContractService {

  private static readonly W3PaymentProcessor = {
    abi: [
      "function buyWithEther(tuple(address payable shop, uint32[] amounts, uint256[] prices, uint256[] itemIds, bytes32[] proofs, bool[] proofFlags) calldata _params) external payable"
    ],
  };

  constructor(
    providerService: ProviderService,
  ) {
    super(providerService);
  }

  buyWithEther(
    contractAddress: string,
    shopContractAddress: string,
    amounts: BigNumber[],
    prices: BigNumber[],
    itemIds: BigNumber[],
    proof: string[],
    proofFlags: boolean[]
  ): Observable<void> {
    const totalPrice = prices.map(p => BigNumber.from(p))
      .reduce((a, b) => a.add(b));

    const buyParams = {
      shop: shopContractAddress,
      amounts: amounts,
      prices: prices,
      itemIds: itemIds,
      proofs: proof,
      proofFlags: proofFlags
    };

    return this.getSignerContractOrThrow(
      contractAddress,
      PaymentProcessorContractService.W3PaymentProcessor.abi
    ).pipe(
      mergeMap(contract => {
        return from(contract.buyWithEther(buyParams, {
          value: totalPrice,
        }));
      }),
      mergeMap((tx: any) => from(tx.wait())),
      catchError(err => handleProviderError(err))
    ) as Observable<void>;
  }
}