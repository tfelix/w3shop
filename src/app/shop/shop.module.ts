import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ItemComponent } from './item/item.component';
import { ShopComponent } from './shop/shop.component';
import { CollectionComponent } from './collection/collection.component';
import { CollectionsComponent } from './collections/collections.component';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { AdminComponent } from '.';

@NgModule({
  declarations: [
    ItemComponent,
    ShopComponent,
    AdminComponent,
    CollectionComponent,
    CollectionsComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    SharedModule,
  ]
})
export class ShopModule { }
