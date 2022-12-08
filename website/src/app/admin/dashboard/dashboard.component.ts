import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, mergeMap, pluck } from 'rxjs/operators';
import { IssueService, MerkleRootIssue, ShopServiceFactory } from 'src/app/shop';


@Component({
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  merkleRootIssue$: Observable<MerkleRootIssue | null>;

  shopBalance$: Observable<string>;
  bundlrBalance$: Observable<string>;

  shopName: string;

  hasNoIssues$: Observable<boolean>;

  isClosingEnabled: boolean = false;

  constructor(
    private readonly issueService: IssueService,
    private readonly shopFactory: ShopServiceFactory,
    private readonly router: Router,
  ) {
  }

  ngOnInit(): void {
    this.issueService.checkIssues();
    this.shopFactory.getShopService().subscribe(s => {
      this.shopName = s.shopName;
    });

    this.merkleRootIssue$ = this.issueService.issues$.pipe(pluck('merkleRootIssue'));
    this.hasNoIssues$ = this.issueService.issues$.pipe(
      map(issues => {
        const values = Object.values(issues);
        return values.every(v => v === null ? true : false);
      })
    );
  }

  checkClosingShop(event: any) {
    this.isClosingEnabled = event.target.value === this.shopName;
  }

  closeShop() {
    this.shopFactory.getShopService().pipe(
      mergeMap(s => s.close())
    ).subscribe(() => {
      console.info('Shop was closed permanently');
      this.router.navigateByUrl('/');
    });
  }

  solveMerkleRootIssue() {
    this.shopFactory.getShopService().pipe(
      mergeMap(shop => shop.updateItemsRoot())
    ).subscribe(() => {
      this.issueService.checkIssues();
    });
  }
}
