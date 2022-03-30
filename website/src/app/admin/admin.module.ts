import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { NgWizardModule, NgWizardConfig, THEME } from 'ng-wizard';

import { SharedModule } from 'src/app/shared/shared.module';

import { NewCollectionComponent } from './new-collection/new-collection.component';
import { EditCollectionComponent } from './edit-collection/edit-collection.component';
import { SettingsComponent } from './settings/settings.component';
import { NewItemComponent } from './new-item/new-item.component';
import { AdminComponent } from './admin.component';
import { AdminRoutingModule } from './admin-routing.module';

const ngWizardConfig: NgWizardConfig = {
  theme: THEME.dots
};

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
    AdminRoutingModule,
    NgWizardModule.forRoot(ngWizardConfig)
  ]
})
export class AdminModule { }
