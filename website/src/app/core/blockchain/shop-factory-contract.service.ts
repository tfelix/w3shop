import { Injectable } from "@angular/core";
import { Contract, utils } from "ethers";
import { forkJoin, from, Observable } from "rxjs";
import { catchError, mergeMap, take } from "rxjs/operators";
import { environment } from "src/environments/environment";
import { ShopError } from "../shop-error";
import { ContractService } from "./contract.service";
import { NetworkService } from "./network.service";
import { handleProviderError } from "./provider-errors";
import { ProviderService } from "./provider.service";

// FIXME Move this to the shop module
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
    paymentProcessor: string
  ): Observable<string> {
    if (arweaveShopConfigId.startsWith('http') || environment.ownerNftArweaveId.startsWith('http')) {
      throw new ShopError('Arweave ID expected but a URL was given.');
    }

    const network = this.networkService.getExpectedNetwork();

    return forkJoin([
      this.getSignerContractOrThrow(network.shopFactoryContract, ShopFactoryContractService.W3ShopFactory.abi),
      this.providerService.address$.pipe(take(1)),
    ]).pipe(
      mergeMap(([contract, ownerAddr]) => from(this.deployShopViaFactory(contract, ownerAddr, paymentProcessor, arweaveShopConfigId))),
      catchError(err => handleProviderError(err))
    );
  }

  private async deployShopViaFactory(
    contract: Contract,
    ownerAddress: string,
    paymentProcessor: string,
    arweaveShopConfigId: string
  ): Promise<string> {
    const network = this.networkService.getExpectedNetwork();
    const arweaveUri = 'ar://' + arweaveShopConfigId;
    const salt = utils.randomBytes(32);
    const tx = await contract.createShop(ownerAddress, paymentProcessor, arweaveUri, environment.ownerNftArweaveId, salt);
    const rc = await tx.wait();
    const event = rc.events.find(event => event.event === 'Created');
    const [_, shop] = event.args;

    return shop;
  }
}