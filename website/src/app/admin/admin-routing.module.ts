import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminGuard } from './admin.guard';
import { SettingsComponent } from './settings/settings.component';
import { DashboardComponent } from './dashboard/dashboard.component';

const routes: Routes = [
  {
    path: '',
    // This guard relies on information from a resolver that is not triggered before this guard greenlights
    // the access. We can only workaround if we make the other resolver a guard.
    canActivateChild: [AdminGuard],
    children: [
      { path: '', component: DashboardComponent },
      {
        path: 'item',
        loadChildren: () => import('./add-item/add-item.module').then(m => m.AddItemModule)
      },
      { path: 'settings', component: SettingsComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
