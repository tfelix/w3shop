import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { NewShopComponent } from './setup/new-shop/new-shop.component';
import { HomeComponent } from './setup/home/home.component';

const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'setup', component: NewShopComponent },
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
