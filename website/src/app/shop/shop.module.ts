import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { SharedModule } from '../shared/shared.module';

import { ItemDetailComponent } from './items/item-detail/item-detail.component';
import { PriceComponent } from './price/price.component';
import { AboutComponent } from './about/about.component';
import { ShopComponent } from './shop/shop.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { PageModule } from '../page/page.module';
import { ShopRoutingModule } from './shop-routing.module';
import { ItemsComponent } from './items/items.component';

@NgModule({
  declarations: [
    ItemDetailComponent,
    ItemsComponent,
    PriceComponent,
    AboutComponent,
    ShopComponent,
    NotFoundComponent,
    CheckoutComponent,
  ],
  imports: [
    PageModule,
    RouterModule,
    SharedModule,
    ShopRoutingModule
  ]
})
export class ShopModule { }
