import { NgModule } from '@angular/core';

import { SharedModule } from 'src/app/shared/shared.module';
import { BlockchainModule } from 'src/app/blockchain/blockchain.module';
import { PageModule } from 'src/app/page/page.module';

import { ItemDetailComponent } from './items/item-detail/item-detail.component';
import { AboutComponent } from './about/about.component';
import { ShopComponent } from './shop.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { ShopRoutingModule } from './shop-routing.module';
import { ItemsComponent } from './items/items.component';
import { NoWalletComponent } from './no-wallet/no-wallet.component';
import { ShopErrorComponent } from './items/shop-error/shop-error.component';
import { NavWalletComponent } from './nav-wallet/nav-wallet.component';
import { CartComponent } from './cart/cart.component';
import { AddCartBtnComponent } from './add-cart-btn/add-cart-btn.component';
import { ItemComponent } from './items/item/item.component';
import { SuccessMessageComponent } from './success-message/success-message.component';
import { ShopFooterComponent } from './shop-footer/shop-footer.component';
import { FooterShopNameComponent } from './shop-footer/footer-shop-name/footer-shop-name.component';

@NgModule({
  declarations: [
    ItemDetailComponent,
    CartComponent,
    ItemsComponent,
    AddCartBtnComponent,
    AboutComponent,
    ShopComponent,
    NotFoundComponent,
    ShopErrorComponent,
    NoWalletComponent,
    NavWalletComponent,
    ItemComponent,
    ShopFooterComponent,
    FooterShopNameComponent,
    SuccessMessageComponent,
  ],
  imports: [
    PageModule,
    BlockchainModule,
    SharedModule,
    ShopRoutingModule
  ]
})
export class ShopModule { }
