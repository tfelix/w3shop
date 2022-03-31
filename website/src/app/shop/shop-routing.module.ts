import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NewShopComponent } from '../setup/new-shop/new-shop.component';
import { AboutComponent } from './about/about.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { ItemDetailComponent } from './items/item-detail/item-detail.component';
import { ItemsComponent } from './items/items.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { ShopComponent } from './shop/shop.component';

const routes: Routes = [{
  path: '', component: ShopComponent,
  children: [
    { path: '', component: ItemsComponent },
    // { path: 'setup', component: NewShopComponent }, // shop creation can be in a own module too
    { path: 'about', component: AboutComponent },
    { path: 'checkout', component: CheckoutComponent },
    { path: 'item/not-found', component: NotFoundComponent, pathMatch: 'full' },
    // { path: 'item/:id', component: ItemDetailComponent },
  ]
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ShopRoutingModule { }
