import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AboutComponent } from './about/about.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { ItemDetailComponent } from './items/item-detail/item-detail.component';
import { ItemsComponent } from './items/items.component';
import { NoWalletComponent } from './no-wallet/no-wallet.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { ShopDetailsResolverGuard } from './shop-details-resolver.guard';
import { ShopComponent } from './shop.component';

const routes: Routes = [{
  path: '', component: ShopComponent, canActivate: [ShopDetailsResolverGuard],
  children: [
    { path: '', component: ItemsComponent },
    { path: 'no-wallet', component: NoWalletComponent },
    {
      path: 'my-items',
      loadChildren: () => import('./owned-items/owned-items.module').then(m => m.OwnedItemsModule)
    },
    { path: 'about', component: AboutComponent },
    { path: 'checkout', component: CheckoutComponent },
    {
      path: 'checkout',
      loadChildren: () => import('./checkout/checkout.module').then(m => m.CheckoutModule)
    },
    { path: 'item/not-found', component: NotFoundComponent, pathMatch: 'full' },
    { path: 'item/:id', component: ItemDetailComponent },
    {
      path: 'admin',
      loadChildren: () => import('../admin/admin.module').then(m => m.AdminModule)
    },
    {
      path: 'legal',
      loadChildren: () => import('../legal/legal.module').then(m => m.LegalModule)
    }
  ]
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ShopRoutingModule { }
