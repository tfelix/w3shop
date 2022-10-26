import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DisclaimerComponent } from './page/disclaimer/disclaimer.component';

import { HomeComponent } from './page/home/home.component';
import { LicensesComponent } from './page/licenses/licenses.component';
import { PageComponent } from './page/page.component';
import { PrivacyComponent } from './page/privacy/privacy.component';

const routes: Routes = [
  {
    path: '', component: PageComponent,
    children: [
      { path: 'p/privacy', component: PrivacyComponent },
      { path: 'p/disclaimer', component: DisclaimerComponent },
      { path: 'p/licenses', component: LicensesComponent },
      { path: '', component: HomeComponent, pathMatch: 'full' },
    ]
  },
  {
    path: 'setup',
    loadChildren: () => import('./setup/setup.module').then(m => m.SetupModule)
  },
  {
    path: 's/:bootstrap/admin',
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule)
  },
  {
    path: 's/:bootstrap',
    loadChildren: () => import('./shop/shop.module').then(m => m.ShopModule)
  },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)], // enable tracing with { enableTracing: true }
  exports: [RouterModule]
})
export class AppRoutingModule { }
