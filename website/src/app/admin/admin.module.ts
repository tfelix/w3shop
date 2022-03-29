import { NgModule } from '@angular/core';

import { SharedModule } from '../shared/shared.module';
import { NewCollectionComponent } from './new-collection/new-collection.component';
import { EditCollectionComponent } from './edit-collection/edit-collection.component';
import { RouterModule } from '@angular/router';
import { SettingsComponent } from './settings/settings.component';
import { NewItemComponent } from './new-item/new-item.component';
import { AdminComponent } from './admin.component';
import { AdminRoutingModule } from './admin-routing.module';

@NgModule({
  declarations: [
    AdminComponent,
    NewCollectionComponent,
    NewItemComponent,
    EditCollectionComponent,
    SettingsComponent
  ],
  imports: [
    RouterModule,
    SharedModule,
    AdminRoutingModule
  ]
})
export class AdminModule { }
