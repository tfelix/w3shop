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

  hasNoIssues$: Observable<boolean>;

  constructor(
    private readonly issueService: IssueService,
    readonly providerService: ProviderService,
    readonly shopFactory: ShopServiceFactory,
    @Inject(UPLOAD_SERVICE_TOKEN) private readonly uploadService: UploadService,
  ) {
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
    this.shopFactory.getShopService().pipe(
      mergeMap(shop => shop.updateItemsRoot())
    ).subscribe(() => {
      this.issueService.checkIssues();
    });
  }
}
