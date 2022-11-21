import { Injectable, OnInit } from "@angular/core";
import { BehaviorSubject, combineLatest, forkJoin, Observable } from "rxjs";
import { map, mergeMap, pluck, shareReplay, take, tap } from "rxjs/operators";
import { ShopContractService } from "src/app/blockchain";
import { ShopServiceFactory } from "./shop-service-factory.service";

export interface MerkleRootIssue {
  contractMerkleRoot: string;
  shopMerkleRoot: string;
}

export interface ShopIssues {
  merkleRootIssue: MerkleRootIssue | null;
}

@Injectable({
  providedIn: 'root'
})
export class IssueService implements OnInit {

  private issues = new BehaviorSubject<ShopIssues>({
    merkleRootIssue: null
  });
  issues$: Observable<ShopIssues> = this.issues.asObservable().pipe(
    shareReplay(1)
  );

  constructor(
    private readonly shopFactory: ShopServiceFactory,
    private readonly shopContractService: ShopContractService
  ) {
  }

  ngOnInit(): void {
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
    const shop$ = this.shopFactory.shopService$;

    const currentMerkleRoot$ = shop$.pipe(
      pluck('smartContractAddress'),
      mergeMap(addr => this.shopContractService.getItemsRoot(addr))
    );

    const calculatedMerkleRoot$ = shop$.pipe(
      mergeMap(shop => shop.getMerkleRoot())
    );

    return combineLatest([
      currentMerkleRoot$,
      calculatedMerkleRoot$
    ]).pipe(
      tap(([contractMerkleRoot, shopMerkleRoot]) => {
        console.debug('Current contract root: ', contractMerkleRoot, ' Calculated root: ', shopMerkleRoot)
      }),
      map(([contractMerkleRoot, shopMerkleRoot]) => {
        if (shopMerkleRoot === null) {
          return null;
        }
        if (contractMerkleRoot !== shopMerkleRoot) {
          return { contractMerkleRoot, shopMerkleRoot }
        } else {
          return null;
        }
      }),
      take(1),
      shareReplay(1)
    );
  }
}