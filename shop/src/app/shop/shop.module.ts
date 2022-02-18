import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { SharedModule } from '../shared/shared.module';

import { ItemComponent } from './item/item.component';
import { ShopComponent } from './shop.component';
import { CollectionComponent } from './collection/collection.component';
import { PriceComponent } from './price/price.component';
import { AboutComponent } from './about/about.component';
import { ShopResolverComponent } from './shop-resolver/shop-resolver.component';
import { RelatedCollectionsComponent } from './related-collections/related-collections.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { MimeIconComponent } from './mime-icon/mime-icon.component';
import { PageModule } from '../page/page.module';

@NgModule({
  declarations: [
    ItemComponent,
    ShopComponent,
    CollectionComponent,
    PriceComponent,
    AboutComponent,
    ShopResolverComponent,
    RelatedCollectionsComponent,
    NotFoundComponent,
    CheckoutComponent,
    MimeIconComponent
  ],
  imports: [
    CommonModule,
    PageModule,
    RouterModule,
    SharedModule,
  ]
})
export class ShopModule { }
