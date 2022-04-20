import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { IssueService, MerkleRootIssue } from './issue.service';

@Component({
  selector: 'w3s-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  merkleRootIssue$: Observable<MerkleRootIssue | null>

  constructor(
    private readonly issueService: IssueService
  ) {
  }

  ngOnInit(): void {
    this.issueService.checkIssues();
    // this.merkleRootIssue$ = this.issueService.merkleRootIssue$;
  }

  solveMerkleRootIssue() {

  }
}
