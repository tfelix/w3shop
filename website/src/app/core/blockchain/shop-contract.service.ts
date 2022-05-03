import { Injectable } from "@angular/core";
import { BigNumber, Contract, ethers, utils } from "ethers";
import { combineLatest, forkJoin, from, Observable, of } from "rxjs";
import { catchError, map, mergeMap, shareReplay, take, tap } from "rxjs/operators";
import { Multiproof } from "src/app/shop/proof-generator";
import { environment } from "src/environments/environment";
import { ShopError, WalletError } from "../shop-error";
import { handleProviderError } from "./provider-errors";
import { ProviderService } from "./provider.service";

// FIXME Move this to the shop module
@Injectable({
  providedIn: 'root'
})
export class ShopContractService {

  private static readonly W3ShopFactory = {
    abi: [
      "function createShop(address owner, string memory shopConfig, string memory ownerNftId, bytes32 salt) public returns (address)",
      "event Created(address indexed owner, address shop)"
    ],
  };

  private static readonly W3Shop = {
    abi: [
      "function uri(uint256 id) external view returns (string)",
      "function setItemsRoot(bytes32 _itemsRoot) public",
      "function setShopConfig(string memory _shopConfig) public",
      "function prepareItem(uint256 _id, string memory _uri) external",
      "function prepareItemBatch(uint256[] calldata _ids, string[] calldata _uris) external",
      "function nextTokenId() external view returns (uint256)",
      "function buy(uint256[] calldata amounts, uint256[] calldata prices, uint256[] calldata itemIds, bytes32[] calldata proofs, bool[] calldata proofFlags) external payable",
      "function cashout(address receiver) public",
      "function itemsRoot() public view returns (bytes32)",
      "function closeShop(address receiver) public",
      "function balanceOf(address account, uint256 id) public view returns (uint256)",
      "function shopConfig() public view returns (string)"
    ],
  };

  constructor(
    private readonly providerService: ProviderService
  ) {
  }

  private makeShopContract(
    contractAddress: string,
    provider: ethers.providers.Provider | ethers.Signer
  ): Contract {
    return new ethers.Contract(contractAddress, ShopContractService.W3Shop.abi, provider);
  }

  isAdmin(contractAdresse: string): Observable<boolean> {
    return combineLatest([
      this.providerService.address$,
      this.providerService.provider$
    ]).pipe(
      take(1),
      mergeMap(([address, provider]) => {
        if (!provider) {
          return of(BigNumber.from(0));
        }
        const contract = this.makeShopContract(contractAdresse, provider);

        return contract.balanceOf(address, 0) as Observable<BigNumber>;
      }),
      map(balance => balance.gt(0)),
      shareReplay(1)
    );
  }

  deployShop(arweaveShopConfigId: string): Observable<string> {
    if (arweaveShopConfigId.startsWith('http') || environment.ownerNftArweaveId.startsWith('http')) {
      throw new ShopError('Arweave ID expected but the URL was given.');
    }

    return forkJoin([
      this.getSignerOrThrow(),
      this.providerService.address$.pipe(take(1)),
    ]).pipe(
      mergeMap(([signer, ownerAddr]) => from(this.deployShopViaFactory(signer, ownerAddr, arweaveShopConfigId))),
      catchError(err => {
        if (err.code === 4001) {
          throw new ShopError('User aborted transaction', err);
        } else {
          throw new ShopError('An error occured', err);
        }
      })
    );
  }

  cashout(contractAddress: string, receiverAddr: string): Observable<void> {
    return this.getSignerOrThrow().pipe(
      map(signer => this.makeShopContract(contractAddress, signer)),
      mergeMap(c => from(c.cashout(receiverAddr)) as Observable<any>),
      mergeMap(tx => from(tx.wait()) as Observable<void>),
      catchError(err => handleProviderError(err))
    );
  }

  buy(
    contractAdress: string,
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

    return this.getSignerContractOrThrow(contractAdress).pipe(
      mergeMap(contract => {
        return from(contract.buy(amounts, prices, itemIds, proof.proof, proof.proofFlags, {
          value: totalPrice,
        }));
      }),
      mergeMap((tx: any) => from(tx.wait())),
      catchError(err => handleProviderError(err))
    ) as Observable<void>;
  }

  private getProviderOrThrow(): Observable<ethers.providers.Provider> {
    return this.providerService.provider$.pipe(
      tap(p => {
        if (p === null) {
          throw new WalletError('No wallet was connected');
        }
      }),
      take(1)
    );
  }

  private getSignerOrThrow(): Observable<ethers.Signer> {
    return this.providerService.signer$.pipe(
      tap(p => {
        if (p === null) {
          throw new WalletError('No wallet was connected');
        }
      }),
      take(1)
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

  getItemsRoot(contractAdress: string): Observable<string> {
    return this.getProviderOrThrow().pipe(
      map(p => this.makeShopContract(contractAdress, p)),
      mergeMap(contract => from(contract.itemsRoot())),
    ) as Observable<string>;
  }

  getConfig(contractAdresse: string): Observable<string> {
    return this.getProviderOrThrow().pipe(
      map(provider => this.makeShopContract(contractAdresse, provider)),
      mergeMap(contract => contract.shopConfig()),
    ) as Observable<string>;
  }

  setConfig(contractAdresse: string, configId: string): Observable<void> {
    return this.getSignerOrThrow().pipe(
      map(signer => this.makeShopContract(contractAdresse, signer)),
      mergeMap(contract => {
        return from(this.updateShopConfig(contract, configId));
      }),
    );
  }

  setItemsRoot(contractAdresse: string, itemsRoot: string): Observable<void> {
    return this.getSignerOrThrow().pipe(
      map(signer => this.makeShopContract(contractAdresse, signer)),
      mergeMap(contract => {
        return from(this.updateItemsRoot(contract, itemsRoot));
      }),
    );
  }

  prepareItem(contractAddress: string, itemId: BigNumber, uri: string): Observable<void> {
    return this.getSignerContractOrThrow(contractAddress).pipe(
      mergeMap(contract => from(contract.prepareItem(itemId, uri))),
      tap(x => console.log(x)),
      mergeMap((tx: any) => from(tx.wait())),
      tap(x => console.log(x)),
      catchError(err => handleProviderError(err))
    ) as Observable<void>;
  }

  private getSignerContractOrThrow(contractAddress: string): Observable<Contract> {
    return this.getSignerOrThrow().pipe(
      map(signer => this.makeShopContract(contractAddress, signer))
    )
  }

  private async updateShopConfig(contract: ethers.Contract, configId: string): Promise<void> {
    const tx = await contract.setShopConfig(configId);
    await tx.wait();
  }

  private async updateItemsRoot(contract: ethers.Contract, itemsRoot: string): Promise<void> {
    const tx = await contract.setItemsRoot(itemsRoot);
    await tx.wait();
  }

  private async deployShopViaFactory(
    signer: ethers.Signer,
    ownerAddress: string,
    arweaveShopConfigId: string
  ): Promise<string> {
    const arweaveUri = 'ar://' + arweaveShopConfigId;
    const salt = utils.randomBytes(32);
    const contract = new ethers.Contract(environment.shopFactoryAddr, ShopContractService.W3ShopFactory.abi, signer);
    const tx = await contract.createShop(ownerAddress, arweaveUri, environment.ownerNftArweaveId, salt);
    const rc = await tx.wait();
    const event = rc.events.find(event => event.event === 'Created');
    const [_, shop] = event.args;

    return shop;
  }
}