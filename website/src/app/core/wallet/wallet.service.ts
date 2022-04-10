import { Injectable } from "@angular/core";
import { ethers, utils } from "ethers";
import { Observable } from "rxjs";
import { map, mergeMap, shareReplay, tap } from "rxjs/operators";
import { environment } from "src/environments/environment";
import { ShopError } from "../shop-error";
import { ProviderService } from "./provider.service";


@Injectable({
  providedIn: 'root'
})
export class WalletService {

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
      "function balanceOf(address account, uint256 id) public view virtual override returns (uint256)"
    ],
  };

  isAdmin$: Observable<boolean> = this.providerService.address$.pipe(
    // TODO woher kommt die Contract addresse am besten?
    map(addr => addr === '0xd36e44EFf4160F78E5088e02Fe8406D7638f73b4'),
    shareReplay(1)
  );

  constructor(
    private readonly providerService: ProviderService
  ) {
  }

  deployShop(arweaveShopConfigId: string): Observable<string> {
    if (arweaveShopConfigId.startsWith('http') || environment.ownerNftArweaveId.startsWith('http')) {
      throw new ShopError('Arweave ID expected but the URL was given.');
    }

    return this.providerService.address$.pipe(
      mergeMap(ownerAddr => this.deployShopViaFactory(ownerAddr, arweaveShopConfigId))
    )
  }

  private async deployShopViaFactory(ownerAddress: string, arweaveShopConfigId: string): Promise<string> {
    const signer = this.providerService.getSigner();
    if (signer == null) {
      throw new ShopError('Please connect a wallet first');
    }

    const salt = utils.randomBytes(32);
    const contract = new ethers.Contract(environment.shopFactoryAddr, WalletService.W3ShopFactory.abi, signer);
    const tx = await contract.createShop(ownerAddress, arweaveShopConfigId, environment.ownerNftArweaveId, salt);
    const rc = await tx.wait();
    const event = rc.events.find(event => event.event === 'Created');
    const [owner, shop] = event.args;
    console.log(owner, shop);

    return shop;
  }
}