import { Injectable } from "@angular/core";
import { BehaviorSubject, forkJoin, Observable } from "rxjs";
import { map, mergeMap, tap } from "rxjs/operators";
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
   * TODO Scan all available items for an empty URI. This can probably not solved as the metadata
   * is lost. Must be prevented while creating the items.
   */
  /*
     findEmptyUri() {
      this.shopService.smartContractAddress$.pipe(
        mergeMap(addr => this.shopContractService.getUri(addr, BigNumber.from(1)))
      ).subscribe(x => console.log(x === ""))
    }
    */

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
      tap(([contractMerkleRoot, shopMerkleRoot]) => {
        console.debug('Current contract root: ', contractMerkleRoot, ' Calculated root: ', shopMerkleRoot)
      }),
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