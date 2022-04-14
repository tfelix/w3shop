import { Injectable } from "@angular/core";
import { Contract, ethers, utils } from "ethers";
import { combineLatest, from, Observable, of } from "rxjs";
import { delay, filter, map, mergeMap, shareReplay, tap } from "rxjs/operators";
import { environment } from "src/environments/environment";
import { ShopError } from "../shop-error";
import { ProviderService } from "./provider.service";


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
      "function closeShop(address receiver) public",
      "function balanceOf(address account, uint256 id) public view returns (uint256)",
      "function shopConfig() public view returns (string)"
    ],
  };

  constructor(
    private readonly providerService: ProviderService
  ) {
  }

  private makeContract(contractAddress: string, provider: ethers.providers.Provider): Contract {
    return new ethers.Contract(contractAddress, ShopContractService.W3Shop.abi, provider);
  }

  isAdmin(contractAdresse: string): Observable<boolean> {
    return of(true);
    /*return combineLatest([
      this.providerService.address$,
      this.providerService.provider$
    ]).pipe(
      mergeMap(([address, provider]) => {

        if (!provider) {
          return of(false);
        }

        // const contract = this.makeContract(contractAdresse, provider);

        // return contract.balanceOf(address, 0);
        return of(1);
      }),
      map(balance => balance > 0),
      shareReplay(1)
    );*/
  }

  deployShop(arweaveShopConfigId: string): Observable<string> {
    if (arweaveShopConfigId.startsWith('http') || environment.ownerNftArweaveId.startsWith('http')) {
      throw new ShopError('Arweave ID expected but the URL was given.');
    }

    return this.providerService.address$.pipe(
      mergeMap(ownerAddr => this.deployShopViaFactory(ownerAddr, arweaveShopConfigId))
    )
  }

  getCurrentConfig(contractAdresse: string): Observable<string> {
    // A valid contract id is: 0xCEcFb8fa8a4F572ebe7eC95cdED83914547b1Ba4
    return this.providerService.provider$.pipe(
      filter(p => p !== null),
      map(provider => this.makeContract(contractAdresse, provider)),
      mergeMap(contract => contract.shopConfig()),
    ) as Observable<string>;
  }

  private async deployShopViaFactory(ownerAddress: string, arweaveShopConfigId: string): Promise<string> {
    const signer = this.providerService.getSigner();
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