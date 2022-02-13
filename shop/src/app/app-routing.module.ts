import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AdminComponent } from './admin/admin.component';
import { SetupComponent } from './setup/setup.component';
import { AboutComponent } from './shop/about/about.component';
import { ShopResolverComponent } from './shop/shop-resolver/shop-resolver.component';
import { CheckoutComponent, CollectionComponent, NotFoundComponent, ShopComponent } from './shop';
import { HomeComponent } from './setup/home/home.component';

const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'setup', component: SetupComponent },
  {
    path: ':bootstrap', component: ShopResolverComponent, children: [
      { path: '', component: ShopComponent },
      { path: 'setup', component: SetupComponent },
      { path: 'about', component: AboutComponent },
      { path: 'checkout', component: CheckoutComponent },
      { path: 'collection/not-found', component: NotFoundComponent, pathMatch: 'full' },
      { path: 'collection/:id', component: CollectionComponent },
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
