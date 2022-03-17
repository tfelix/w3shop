import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminComponent } from '../admin';
import { AdminGuard } from '../admin/admin.guard';
import { EditCollectionComponent } from '../admin/edit-collection/edit-collection.component';
import { NewCollectionComponent } from '../admin/new-collection/new-collection.component';
import { SettingsComponent } from '../admin/settings/settings.component';
import { NewShopComponent } from '../setup/new-shop/new-shop.component';
import { AboutComponent } from './about/about.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { CollectionComponent } from './collection/collection.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { ShopResolverComponent } from './shop-resolver/shop-resolver.component';
import { ShopComponent } from './shop.component';

const routes: Routes = [{
  path: '', component: ShopResolverComponent,
  children: [
    { path: '', component: ShopComponent },
    { path: 'setup', component: NewShopComponent }, // shop creation can be in a own module too
    { path: 'about', component: AboutComponent },
    { path: 'checkout', component: CheckoutComponent },
    { path: 'collection/not-found', component: NotFoundComponent, pathMatch: 'full' },
    { path: 'collection/:id', component: CollectionComponent },
    // Put this into a own module as well
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
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ShopRoutingModule { }
