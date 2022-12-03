import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { SharedModule } from '../shared/shared.module';

import { ItemDetailComponent } from './items/item-detail/item-detail.component';
import { PriceComponent } from './price/price.component';
import { AboutComponent } from './about/about.component';
import { ShopComponent } from './shop.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { PageModule } from '../page/page.module';
import { ShopRoutingModule } from './shop-routing.module';
import { ItemsComponent } from './items/items.component';
import { NoWalletComponent } from './no-wallet/no-wallet.component';
import { OwnedItemsComponent } from './owned-items/owned-items.component';
import { ShopErrorComponent } from './items/shop-error/shop-error.component';

import { BlockchainModule } from '../blockchain/blockchain.module';
import { NavWalletComponent } from './nav-wallet/nav-wallet.component';
import { CartComponent } from './cart/cart.component';
import { AddCartBtnComponent } from './add-cart-btn/add-cart-btn.component';

@NgModule({
  declarations: [
    ItemDetailComponent,
    CartComponent,
    ItemsComponent,
    AddCartBtnComponent,
    PriceComponent,
    AboutComponent,
    ShopComponent,
    NotFoundComponent,
    CheckoutComponent,
    ShopErrorComponent,
    NoWalletComponent,
    NavWalletComponent,
    OwnedItemsComponent,
  ],
  imports: [
    PageModule,
    BlockchainModule,
    RouterModule,
    SharedModule,
    ShopRoutingModule
  ]
})
export class ShopModule { }
