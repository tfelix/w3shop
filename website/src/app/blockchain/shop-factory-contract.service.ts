import { Injectable } from '@angular/core';
import { Contract } from 'ethers';
import { forkJoin, from, Observable } from 'rxjs';
import { catchError, mergeMap, take } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { ContractService } from './contract.service';
import { NetworkService } from '../core/network.service';
import { handleProviderError } from './provider-errors';
import { ProviderService } from './provider.service';

import { ShopError } from 'src/app/core';

@Injectable({
  providedIn: 'root'
})
export class ShopFactoryContractService extends ContractService {

  private static readonly W3ShopFactory = {
    abi: [
      'event CreatedShop(address indexed owner, address shop)',
      'function createShop(tuple(address owner, string name, string ownerMetaUri, string shopConfigUri, string shopContractUri, address paymentProcessor, address paymentReceiver), bytes32 _salt) external returns (address)'
    ],
  };

  constructor(
    providerService: ProviderService,
    private readonly networkService: NetworkService
  ) {
    super(providerService);
  }

  deployShop(
    shopName: string,
    shopConfigUri: string,
    shopContractMetaUri: string,
    paymentProcessorIdx: number,
    salt: string
  ): Observable<string> {
    this.verifyValidUri(shopConfigUri);
    // Disabled until the OS meta generation is handled better.
    // this.verifyValidUri(shopContractMetaUri);

    const network = this.networkService.getExpectedNetwork();
    const paymentProcessor = network.paymentProcessors[paymentProcessorIdx].address;

    return forkJoin([
      this.getSignerContractOrThrow(network.shopFactoryContract, ShopFactoryContractService.W3ShopFactory.abi),
      this.providerService.address$.pipe(take(1)),
    ]).pipe(
      mergeMap(([contract, ownerAddr]) => from(this.deployShopViaFactory(
        contract,
        ownerAddr,
        shopName,
        paymentProcessor,
        shopConfigUri,
        environment.ownerNftArweaveUri,
        shopContractMetaUri,
        salt
      ))),
      catchError(err => handleProviderError(err))
    );
  }

  private verifyValidUri(uri: string) {
    if (!uri.startsWith('ar://')) {
      throw new ShopError('Arweave ID (ar://[...]) expected, instead got: ' + uri);
    }
  }

  private async deployShopViaFactory(
    contract: Contract,
    ownerAddress: string,
    shopName: string,
    paymentProcessor: string,
    shopConfigUri: string,
    ownerNftUri: string,
    shopContractMetaUri: string,
    salt: string
  ): Promise<string> {
    const tx = await contract.createShop({
      owner: ownerAddress,
      name: shopName,
      ownerMetaUri: ownerNftUri,
      shopConfigUri: shopConfigUri,
      shopContractUri: shopContractMetaUri,
      paymentProcessor: paymentProcessor,
      paymentReceiver: ownerAddress
    }, salt);
    // Maybe persist the TX ID to later examine it if user leaves the page and the shop creation is missed?
    // So the user can look it up again? Instroduce a ShopCreationPersistenceService that is something like
    // a state machine that keeps track of the state while creating the shop.
    const rc = await tx.wait();
    const event = rc.events.find(event => event.event === 'CreatedShop');
    const [_, shop] = event.args;

    return shop;
  }
}