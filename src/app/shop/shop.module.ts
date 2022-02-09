import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';

import { ItemComponent } from './item/item.component';
import { ShopComponent } from './shop/shop.component';
import { CollectionComponent } from './collection/collection.component';
import { CollectionsComponent } from './collections/collections.component';
import { PriceComponent } from './price/price.component';

@NgModule({
  declarations: [
    ItemComponent,
    ShopComponent,
    CollectionComponent,
    CollectionsComponent,
    PriceComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    SharedModule,
  ]
})
export class ShopModule { }
