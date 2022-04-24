import { Injectable } from "@angular/core";
import { BigNumber, Contract, ethers, utils } from "ethers";
import { combineLatest, forkJoin, from, Observable, of } from "rxjs";
import { filter, map, mergeMap, shareReplay, take, tap } from "rxjs/operators";
import { Multiproof } from "src/app/shop/proof-generator";
import { environment } from "src/environments/environment";
import { ShopError, WalletError } from "../shop-error";
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
      "function setShopData(string memory _shopConfig, bytes32 _itemsRoot) public",
      "function prepareItem(uint256 id, string memory _uri) public",
      "function buy(uint256[] memory amounts, uint256[] memory prices, uint256[] memory itemIds, bytes32[] memory proofs, bool[] memory proofFlags) public payable",
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

  private handleWalletError(e: any) {
    if (e.code === -32603) {
      throw new ShopError('Contract execution reverted', e);
    }
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

    return this.providerService.address$.pipe(
      mergeMap(ownerAddr => this.deployShopViaFactory(ownerAddr, arweaveShopConfigId))
    )
  }

  buy(
    contractAdress: string,
    amounts: BigNumber[],
    prices: BigNumber[],
    itemIds: BigNumber[],
    proof: Multiproof
  ): Observable<void> {
    return this.providerService.signer$.pipe(
      mergeMap(s => from(this.doBuy(contractAdress, s, amounts, prices, itemIds, proof)))
    )
  }

  private async doBuy(
    contractAdress: string,
    signer: ethers.Signer,
    amounts: BigNumber[],
    prices: BigNumber[],
    itemIds: BigNumber[],
    proof: Multiproof
  ): Promise<void> {
    if (signer == null) {
      throw new ShopError('Please connect a wallet first');
    }
    const totalPrice = prices.map(p => BigNumber.from(p))
      .reduce((a, b) => a.add(b));

    const itemIdsNum = itemIds.map(x => x.toBigInt());
    const amountsNum = amounts.map(x => x.toBigInt());
    const totalPriceNum = totalPrice.toBigInt();
    console.log(`Buying items ${itemIdsNum} with amounts ${amountsNum}, total: ${totalPriceNum}`);

    const contract = this.makeShopContract(contractAdress, signer);
    try {
      const tx = await contract.buy(amounts, prices, itemIds, proof.proof, proof.proofFlags, {
        value: totalPrice,
      });
      await tx.wait();
    } catch (e) {
      this.handleWalletError(e);

      throw e;
    }
  }

  private getProviderOrThrow(): Observable<ethers.providers.Provider> {
    return this.providerService.provider$.pipe(
      tap(p => {
        if (p === null) {
          throw new WalletError('No wallet was connected');
        }
      }),
    );
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
    // A valid contract id is: 0xCEcFb8fa8a4F572ebe7eC95cdED83914547b1Ba4
    return this.providerService.provider$.pipe(
      filter(p => p !== null),
      map(provider => this.makeShopContract(contractAdresse, provider)),
      mergeMap(contract => contract.shopConfig()),
    ) as Observable<string>;
  }

  setConfig(contractAdresse: string, configId: string, itemsRoot?: string): Observable<void> {
    return this.providerService.signer$.pipe(
      mergeMap(signer => {
        if (signer == null) {
          throw new ShopError('Please connect a wallet first');
        }

        const contract = new ethers.Contract(contractAdresse, ShopContractService.W3Shop.abi, signer);
        return from(this.updateShop(contract, configId, itemsRoot));
      }),
    );
  }

  private async updateShop(contract: ethers.Contract, configId: string, itemsRoot: string): Promise<void> {
    const tx = await contract.setShopData(configId, itemsRoot);
    await tx.wait();
  }

  private async deployShopViaFactory(ownerAddress: string, arweaveShopConfigId: string): Promise<string> {
    const signer = await this.providerService.signer$.toPromise();
    if (signer == null) {
      throw new ShopError('Please connect a wallet first');
    }

    const salt = utils.randomBytes(32);
    const contract = new ethers.Contract(environment.shopFactoryAddr, ShopContractService.W3ShopFactory.abi, signer);
    const tx = await contract.createShop(ownerAddress, arweaveShopConfigId, environment.ownerNftArweaveId, salt);
    const rc = await tx.wait();
    const event = rc.events.find(event => event.event === 'Created');
    const [_, shop] = event.args;

    return shop;
  }
}