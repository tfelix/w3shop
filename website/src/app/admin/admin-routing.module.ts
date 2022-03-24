import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminGuard } from './admin.guard';
import { EditCollectionComponent } from './edit-collection/edit-collection.component';
import { SettingsComponent } from './settings/settings.component';
import { NewItemComponent } from './new-item/new-item.component';


const routes: Routes = [
  {
    path: '', canActivateChild: [AdminGuard], children: [
      { path: 'item', component: NewItemComponent },
      { path: 'item/:id', component: EditCollectionComponent },
      { path: 'settings', component: SettingsComponent },
      { path: '', redirectTo: 'collection', pathMatch: 'prefix' },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
