import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AdminComponent } from './admin/admin.component';
import { NewShopComponent } from './setup/new-shop/new-shop.component';
import { AboutComponent } from './shop/about/about.component';
import { ShopResolverComponent } from './shop/shop-resolver/shop-resolver.component';
import { CheckoutComponent, CollectionComponent, NotFoundComponent, ShopComponent } from './shop';
import { HomeComponent } from './setup/home/home.component';
import { EditCollectionComponent } from './admin/edit-collection/edit-collection.component';
import { NewCollectionComponent } from './admin/new-collection/new-collection.component';
import { AdminGuard } from './admin/admin.guard';
import { SettingsComponent } from './admin/settings/settings.component';

const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'setup', component: NewShopComponent },
  {
    path: ':bootstrap', component: ShopResolverComponent, children: [
      { path: '', component: ShopComponent },
      { path: 'setup', component: NewShopComponent },
      { path: 'about', component: AboutComponent },
      { path: 'checkout', component: CheckoutComponent },
      { path: 'collection/not-found', component: NotFoundComponent, pathMatch: 'full' },
      { path: 'collection/:id', component: CollectionComponent },
      {
        path: 'admin', component: AdminComponent, canActivate: [AdminGuard], children: [
          {
            path: '', canActivateChild: [AdminGuard], children: [
              { path: 'collection', component: NewCollectionComponent },
              { path: 'collection/:id', component: EditCollectionComponent },
              { path: 'settings', component: SettingsComponent },
              { path: '', redirectTo: 'collection', pathMatch: 'prefix' },
            ]
          }
        ]
      },
    ]
  },
  { path: '**', redirectTo: '/setup' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
