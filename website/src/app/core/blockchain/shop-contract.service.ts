import { Injectable } from "@angular/core";
import { BigNumber, Contract, ethers, utils } from "ethers";
import { combineLatest, from, Observable, of } from "rxjs";
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
      "function itemsRoot() public view returns (string)",
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

    return this.providerService.address$.pipe(
      mergeMap(ownerAddr => this.deployShopViaFactory(ownerAddr, arweaveShopConfigId))
    )
  }

  buy(
    contractAdress: string,
    amounts: number[],
    prices: number[],
    itemIds: number[],
    proof: Multiproof
  ): Observable<void> {
    return from(this.doBuy(contractAdress, amounts, prices, itemIds, proof));
  }

  private async doBuy(
    contractAdress: string,
    amounts: number[],
    prices: number[],
    itemIds: number[],
    proof: Multiproof
  ): Promise<void> {
    const signer = await this.providerService.signer$.toPromise();
    if (signer == null) {
      throw new ShopError('Please connect a wallet first');
    }
    const totalPrice = prices.map(p => BigNumber.from(p))
      .reduce((a, b) => a.add(b));

    const contract = this.makeShopContract(contractAdress, signer);
    const tx = await contract.buy(amounts, prices, itemIds, proof.proof, proof.proofFlags, {
      value: totalPrice,
    });
    await tx.wait();
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

  getItemsRoot(contractAdress: string): Observable<string> {
    return this.getProviderOrThrow().pipe(
      map(p => this.makeShopContract(contractAdress, p)),
      mergeMap(contract => contract.itemsRoot()),
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
    return from(this.updateConfigAndItemsRoot(contractAdresse, configId, itemsRoot));
  }

  private async updateConfigAndItemsRoot(
    contractAdresse: string,
    configId: string,
    itemsRoot?: string
  ) {
    const signer = await this.providerService.signer$.toPromise();
    if (signer == null) {
      throw new ShopError('Please connect a wallet first');
    }

    const contract = new ethers.Contract(contractAdresse, ShopContractService.W3Shop.abi, signer);

    if (!itemsRoot) {
      itemsRoot = await contract.itemsRoot();
      console.log('Requested current itemsRoot', itemsRoot);
    }

    await contract.setShopData(configId, itemsRoot);
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