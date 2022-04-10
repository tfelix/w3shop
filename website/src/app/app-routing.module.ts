import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { NewShopComponent } from './setup/new-shop/new-shop.component';
import { HomeComponent } from './setup/home/home.component';
import { SuccessComponent } from './setup/success/success.component';

const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  // Make a lazy loaded shop component.
  { path: 'setup', component: NewShopComponent },
  { path: 'success', component: SuccessComponent },
  { path: ':bootstrap/shop', component: NewShopComponent },
  {
    path: ':bootstrap/admin',
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule)
  },
  {
    path: ':bootstrap',
    loadChildren: () => import('./shop/shop.module').then(m => m.ShopModule)
  },
  { path: '**', redirectTo: '/setup' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
