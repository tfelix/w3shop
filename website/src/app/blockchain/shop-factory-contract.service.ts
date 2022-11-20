import { Injectable } from "@angular/core";
import { Contract } from "ethers";
import { forkJoin, from, Observable } from "rxjs";
import { catchError, mergeMap, take } from "rxjs/operators";
import { environment } from "src/environments/environment";
import { ContractService } from "./contract.service";
import { NetworkService } from "../core/network.service";
import { handleProviderError } from "./provider-errors";
import { ProviderService } from "./provider.service";

import { ShopError } from "src/app/core";

@Injectable({
  providedIn: 'root'
})
export class ShopFactoryContractService extends ContractService {

  private static readonly W3ShopFactory = {
    abi: [
      "function createShop(address _owner, address _paymentProcessor, string calldata _shopConfig, string calldata _ownerNftId, bytes32 _salt) public returns (address)",
      "event Created(address indexed owner, address shop)"
    ],
  };

  constructor(
    providerService: ProviderService,
    private readonly networkService: NetworkService
  ) {
    super(providerService);
  }

  deployShop(
    arweaveShopConfigId: string,
    paymentProcessorIdx: number,
    salt: string
  ): Observable<string> {
    if (!arweaveShopConfigId.startsWith('ar://')) {
      throw new ShopError('Arweave ID (ar://[...]) expected');
    }

    const network = this.networkService.getExpectedNetwork();
    const paymentProcessor = network.paymentProcessors[paymentProcessorIdx].address;

    return forkJoin([
      this.getSignerContractOrThrow(network.shopFactoryContract, ShopFactoryContractService.W3ShopFactory.abi),
      this.providerService.address$.pipe(take(1)),
    ]).pipe(
      mergeMap(([contract, ownerAddr]) => from(this.deployShopViaFactory(
        contract,
        ownerAddr,
        paymentProcessor,
        arweaveShopConfigId,
        salt)
      )),
      catchError(err => handleProviderError(err))
    );
  }

  private async deployShopViaFactory(
    contract: Contract,
    ownerAddress: string,
    paymentProcessor: string,
    arweaveShopConfigUri: string,
    salt: string
  ): Promise<string> {
    const tx = await contract.createShop(ownerAddress, paymentProcessor, arweaveShopConfigUri, environment.ownerNftArweaveId, salt);
    const rc = await tx.wait();
    const event = rc.events.find(event => event.event === 'Created');
    const [_, shop] = event.args;

    return shop;
  }
}