import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AdminComponent } from './admin/admin.component';
import { SetupComponent } from './setup/setup/setup.component';
import { ShopComponent } from './shop/shop.component';
import { AboutComponent } from './shop/about/about.component';
import { ShopResolverComponent } from './shop/shop-resolver/shop-resolver.component';

const routes: Routes = [
  { path: 'setup', component: SetupComponent },
  {
    path: ':bootstrap', component: ShopResolverComponent, children: [
      { path: '', component: ShopComponent },
      { path: 'setup', component: SetupComponent },
      { path: 'about', component: AboutComponent },
    ]
  },
  {
    path: ':bootstrap', component: ShopResolverComponent, children: [
      { path: 'admin', component: AdminComponent },
      { path: 'admin/collection', component: AdminComponent },
      { path: 'admin/collection/:id', component: AdminComponent },
      { path: 'admin/collection/new', component: AdminComponent },
    ]
  },
  { path: '**', redirectTo: '/setup' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
