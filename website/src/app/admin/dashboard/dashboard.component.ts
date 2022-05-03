import { Component, Inject, OnInit } from '@angular/core';
import { BigNumber } from 'ethers';
import { forkJoin, Observable } from 'rxjs';
import { map, mergeMap, pluck } from 'rxjs/operators';
import {
  IssueService, MerkleRootIssue, ProviderService, ShopContractService,
  ShopService, ShopServiceFactory, UploadService
} from 'src/app/core';

@Component({
  selector: 'w3s-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  merkleRootIssue$: Observable<MerkleRootIssue | null>;
  shopBalance$: Observable<string>;
  bundlrBalance$: Observable<string>;
  walletAddress$: Observable<string>;

  hasNoIssues$: Observable<boolean>;

  private shopService: ShopService = this.shopFactory.build();

  constructor(
    private readonly issueService: IssueService,
    readonly providerService: ProviderService,
    readonly shopFactory: ShopServiceFactory,
    private readonly shopContractService: ShopContractService,
    @Inject('Upload') private readonly uploadService: UploadService,
  ) {
    this.walletAddress$ = providerService.address$;
    this.updateShopBalance();
    this.updateBundlrBalance();

    this.merkleRootIssue$ = this.issueService.issues$.pipe(pluck('merkleRootIssue'));

    this.hasNoIssues$ = forkJoin(
      [this.merkleRootIssue$]
    ).pipe(
      map(issues => {
        let hasIssues = false;
        issues.forEach(i => hasIssues = (hasIssues || i !== null))

        return hasIssues;
      })
    )
  }

  ngOnInit(): void {
    this.issueService.checkIssues();
  }

  solveMerkleRootIssue() {
    this.shopService.updateItemsRoot().subscribe(
      _ => { },
      _ => { },
      () => this.issueService.checkIssues()
    )
  }

  /**
   * FIXME Only for testing.
   */
  solveItemIssue() {
    this.shopService.smartContractAddress$.pipe(
      mergeMap(addr => this.shopContractService.prepareItem(addr, BigNumber.from(1), "ar://AAAAAAAAAAAAAAAAAA"))
    ).subscribe();
  }

  withdrawCash(cashoutAddr: string) {
    // TODO Add a warning if the funds is < 10 times as the gas costs of (0.000004922288845242 ETH).
    this.shopService.withdraw(cashoutAddr).subscribe(
      () => this.updateShopBalance()
    );
  }

  private updateShopBalance() {
    this.shopBalance$ = this.shopService.shopBalance();
  }

  private updateBundlrBalance() {
    this.bundlrBalance$ = this.uploadService.getCurrentBalance();
  }
}
