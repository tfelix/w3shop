import { Injectable } from "@angular/core";
import { forkJoin, Observable, of } from "rxjs";
import { map, mergeMap, shareReplay, tap } from "rxjs/operators";
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

  merkleRootIssue: MerkleRootIssue | null;

  constructor(
    private readonly shopFactory: ShopServiceFactory,
    private readonly shopContractService: ShopContractService
  ) {
  }

  /**
   * We must keep all issues inside this service so they can be show on the nav bar.
   */
  checkIssues() {
    this.validateItemRootHash();
  }

  /**
   * Calcualtes the merkle hash of the current shop and compares it to the one saved in the smart
   * contract.
   */
  private validateItemRootHash() {
    const shop = this.shopFactory.build();

    const itemRootObs = shop.smartContractAddress$.pipe(
      mergeMap(addr => this.shopContractService.getItemsRoot(addr))
    );

    forkJoin([
      itemRootObs,
      generateMerkleRootFromShop(shop) // this seems not to complete so the forkJoin does not trigger.
    ]).pipe(
      map(([contractMerkleRoot, shopMerkleRoot]) => {
        if (contractMerkleRoot !== shopMerkleRoot) {
          return { contractMerkleRoot, shopMerkleRoot }
        } else {
          return null;
        }
      }),
    ).subscribe(issue => this.merkleRootIssue = issue);
  }
}