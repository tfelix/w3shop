import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminComponent } from '.';

import { SharedModule } from '../shared/shared.module';
import { NewCollectionComponent } from './new-collection/new-collection.component';
import { EditCollectionComponent } from './edit-collection/edit-collection.component';
import { RouterModule } from '@angular/router';
import { SettingsComponent } from './settings/settings.component';

@NgModule({
  declarations: [
    AdminComponent,
    NewCollectionComponent,
    EditCollectionComponent,
    SettingsComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    SharedModule
  ]
})
export class AdminModule { }
