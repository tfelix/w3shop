import { Injectable } from "@angular/core";
import { forkJoin, Observable } from "rxjs";
import { map, mergeMap } from "rxjs/operators";
import { ShopContractService, ShopServiceFactory } from "src/app/core";
import { generateMerkleRootFromShop } from "src/app/shop/proof-generator";

export interface MerkleRootIssue {
  contractMerkleRoot: string;
  shopMerkleRoot: string;
}

@Injectable({
  providedIn: 'root'
})
export class IssueService {

  merkleRootIssue$: Observable<MerkleRootIssue | null>;

  constructor(
    private readonly shopFactory: ShopServiceFactory,
    private readonly shopContractService: ShopContractService
  ) {
  }

  /**
   * We must keep all issues inside this service so they can be show on the nav bar.
   */
  checkIssues() {
    this.merkleRootIssue$ = this.validateItemRootHash();
  }

  /**
   * Calcualtes the merkle hash of the current shop and compares it to the one saved in the smart
   * contract.
   */
  private validateItemRootHash(): Observable<MerkleRootIssue | null> {
    const shop = this.shopFactory.build();

    const itemRootObs = shop.smartContractAddress$.pipe(
      mergeMap(addr => this.shopContractService.getItemsRoot(addr))
    );

    return forkJoin([
      itemRootObs,
      generateMerkleRootFromShop(shop)
    ]).pipe(
      map(([contractMerkleRoot, shopMerkleRoot]) => {
        if (contractMerkleRoot !== shopMerkleRoot) {
          return { contractMerkleRoot, shopMerkleRoot }
        } else {
          return null;
        }
      })
    );
  }
}