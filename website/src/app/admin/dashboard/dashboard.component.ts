import { Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { IssueService, MerkleRootIssue, ShopServiceFactory } from 'src/app/core';

@Component({
  selector: 'w3s-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  merkleRootIssue$: Observable<MerkleRootIssue | null>;
  shopBalance$: Observable<string>;

  constructor(
    private readonly issueService: IssueService,
    readonly shopFactory: ShopServiceFactory
  ) {
    this.shopBalance$ = shopFactory.build().shopBalance$;
  }

  ngOnInit(): void {
    this.issueService.checkIssues();
    // this.merkleRootIssue$ = this.issueService.merkleRootIssue$;
  }

  solveMerkleRootIssue() {

  }
}
