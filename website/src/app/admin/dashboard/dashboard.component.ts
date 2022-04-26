import { Component, OnInit } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IssueService, MerkleRootIssue, ProviderService, ShopService, ShopServiceFactory } from 'src/app/core';

@Component({
  selector: 'w3s-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  merkleRootIssue$: Observable<MerkleRootIssue | null>;
  shopBalance$: Observable<string>;
  walletAddress$: Observable<string>;

  hasNoIssues$: Observable<boolean>;

  private shopService: ShopService;

  constructor(
    private readonly issueService: IssueService,
    readonly providerService: ProviderService,
    readonly shopFactory: ShopServiceFactory
  ) {
    this.shopService = shopFactory.build();
    this.shopBalance$ = this.shopService.shopBalance$;
    this.walletAddress$ = providerService.address$;

    this.merkleRootIssue$ = this.issueService.issues$.pipe(map(x => x.merkleRootIssue));

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

  withdrawCash(cashoutAddr: string) {
    // TODO Add a warning if the funds is < 10 times as the gas costs of (0.000004922288845242 ETH).
    this.shopService.withdraw(cashoutAddr).subscribe(
      () => {
        // FIXME perform a reload to update the balance of the smart contract on display now.
        console.log('Funds withdraw completed');
      }
    );
  }
}
