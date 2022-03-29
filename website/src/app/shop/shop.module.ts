import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { SharedModule } from '../shared/shared.module';

import { ItemDetailComponent } from './items/item-detail/item-detail.component';
import { PriceComponent } from './price/price.component';
import { AboutComponent } from './about/about.component';
import { ShopResolverComponent } from './shop-resolver/shop-resolver.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { MimeIconComponent } from './mime-icon/mime-icon.component';
import { PageModule } from '../page/page.module';
import { ShopRoutingModule } from './shop-routing.module';
import { ItemsComponent } from './items/items.component';

@NgModule({
  declarations: [
    ItemDetailComponent,
    ItemsComponent,
    PriceComponent,
    AboutComponent,
    ShopResolverComponent,
    NotFoundComponent,
    CheckoutComponent,
    MimeIconComponent
  ],
  imports: [
    PageModule,
    RouterModule,
    SharedModule,
    ShopRoutingModule
  ]
})
export class ShopModule { }
