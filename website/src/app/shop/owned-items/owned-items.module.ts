import { NgModule } from '@angular/core';

import { SharedModule } from 'src/app/shared/shared.module';
import { OwnedItemsRoutingModule } from './owned-items-routing.module';

import { OwnedItemsComponent } from './owned-items.component';


@NgModule({
  declarations: [
    OwnedItemsComponent
  ],
  imports: [
    SharedModule,
    OwnedItemsRoutingModule
  ]
})
export class OwnedItemsModule { }