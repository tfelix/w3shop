import { Component, Inject, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map, mergeMap, pluck } from 'rxjs/operators';
import { ProviderService, UploadService, UPLOAD_SERVICE_TOKEN } from 'src/app/blockchain';
import { IssueService, MerkleRootIssue, ShopServiceFactory } from 'src/app/shop';


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

  constructor(
    private readonly issueService: IssueService,
    readonly providerService: ProviderService,
    readonly shopFactory: ShopServiceFactory,
    @Inject(UPLOAD_SERVICE_TOKEN) private readonly uploadService: UploadService,
  ) {
    this.walletAddress$ = providerService.address$;
    this.updateShopBalance();
    this.updateBundlrBalance();

    this.merkleRootIssue$ = this.issueService.issues$.pipe(pluck('merkleRootIssue'));

    this.hasNoIssues$ = this.issueService.issues$.pipe(
      map(issues => {
        const values = Object.values(issues);
        return values.every(v => v === null ? true : false)
      })
    );
  }

  ngOnInit(): void {
    this.issueService.checkIssues();
  }

  solveMerkleRootIssue() {
    this.shopFactory.shopService$.pipe(
      mergeMap(shop => shop.updateItemsRoot())
    ).subscribe(() => {
      this.issueService.checkIssues();
    });
  }

  withdrawCash(cashoutAddr: string) {
    // TODO Add a warning if the funds is < 10 times as the gas costs of (0.000004922288845242 ETH).
    this.shopFactory.shopService$.pipe(
      mergeMap(shop => shop.withdraw(cashoutAddr))
    ).subscribe(
      () => this.updateShopBalance()
    );
  }

  private updateShopBalance() {
    this.shopBalance$ = this.shopFactory.shopService$.pipe(
      mergeMap(shop => shop.shopBalance())
    );
  }

  private updateBundlrBalance() {
    this.bundlrBalance$ = this.uploadService.getCurrentBalance();
  }
}
