import { NgModule } from '@angular/core';

import { SharedModule } from 'src/app/shared/shared.module';
import { AddItemRoutingModule } from './add-item-routing.module';
import { AddItemComponent } from './add-item.component';

@NgModule({
  declarations: [
    AddItemComponent,
  ],
  imports: [
    SharedModule,
    AddItemRoutingModule,
  ]
})
export class AddItemModule { }