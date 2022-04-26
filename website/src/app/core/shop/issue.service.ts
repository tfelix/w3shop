import { Injectable } from "@angular/core";
import { BehaviorSubject, forkJoin, Observable } from "rxjs";
import { map, mergeMap } from "rxjs/operators";
import { ShopContractService, ShopServiceFactory } from "src/app/core";
import { generateMerkleRootFromShop } from "src/app/shop/proof-generator";

export interface MerkleRootIssue {
  contractMerkleRoot: string;
  shopMerkleRoot: string;
}

export interface ShopIssues {
  merkleRootIssue: MerkleRootIssue | null
}

@Injectable({
  providedIn: 'root'
})
export class IssueService {

  private issues = new BehaviorSubject<ShopIssues>({
    merkleRootIssue: null
  });
  issues$: Observable<ShopIssues> = this.issues.asObservable();

  constructor(
    private readonly shopFactory: ShopServiceFactory,
    private readonly shopContractService: ShopContractService
  ) {
    this.checkIssues();
  }

  /**
   * We must keep all issues inside this service so they can be show on the nav bar.
   */
  checkIssues() {
    forkJoin([
      this.validateItemRootHash()
    ]).subscribe(([merkleRootIssue]) => {
      this.issues.next({
        merkleRootIssue: merkleRootIssue
      });
    });
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
      }),
    );
  }
}