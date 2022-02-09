import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';

import { ItemComponent } from './item/item.component';
import { ShopComponent } from './shop.component';
import { CollectionComponent } from './collection/collection.component';
import { CollectionsComponent } from './collections/collections.component';
import { PriceComponent } from './price/price.component';
import { CoreModule } from '../core/core.module';
import { AboutComponent } from './about/about.component';
import { ShopResolverComponent } from '.';

@NgModule({
  declarations: [
    ItemComponent,
    ShopComponent,
    CollectionComponent,
    CollectionsComponent,
    PriceComponent,
    AboutComponent,
    ShopResolverComponent
  ],
  imports: [
    CommonModule,
    CoreModule,
    RouterModule,
    SharedModule,
  ]
})
export class ShopModule { }
