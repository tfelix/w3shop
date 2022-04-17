import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ShopFacadeFactory, ShopInfoService } from 'src/app/core';

@Component({
  templateUrl: './shop.component.html',
})
export class ShopComponent implements OnInit {
  constructor(
    private readonly shopInfoService: ShopInfoService,
    private readonly shopFactory: ShopFacadeFactory
  ) {
  }

  ngOnInit(): void {
    // Its probably safer to do this somewhere inside the boot logic of the shop instead of
    // waiting for this component to resolve. But this was fast for now.
    const shop = this.shopFactory.build();
    if (shop !== null) {
      forkJoin({
        shopName: shop.shopName$,
        description: shop.description$,
        isAdmin: shop.isAdmin$,
        shopIdentifier: shop.identifier$
      }).subscribe(si => this.shopInfoService.resolveShop(si))
    }
  }
}
