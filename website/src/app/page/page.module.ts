import { NgModule } from '@angular/core';

import { SharedModule } from '../shared/shared.module';

import { NavComponent } from './nav/nav.component';
import { FooterComponent } from './footer/footer.component';
import { CartComponent } from './cart/cart.component';
import { AlphaWarningComponent } from './alpha-warning/alpha-warning.component';
import { HeaderComponent } from './header/header.component';
import { FooterLinkComponent } from './footer-link/footer-link.component';
import { HomeComponent } from './home/home.component';
import { PrivacyComponent } from './privacy/privacy.component';
import { DisclaimerComponent } from './disclaimer/disclaimer.component';
import { LicensesComponent } from './licenses/licenses.component';
import { ShopNameComponent } from './nav/shop-name/shop-name.component';
import { NavWalletComponent } from './nav/nav-wallet/nav-wallet.component';
import { PageComponent } from './page.component';

@NgModule({
  declarations: [
    NavComponent,
    FooterComponent,
    CartComponent,
    HeaderComponent,
    HomeComponent,
    AlphaWarningComponent,
    FooterLinkComponent,
    PrivacyComponent,
    DisclaimerComponent,
    LicensesComponent,
    ShopNameComponent,
    NavWalletComponent,
    PageComponent
  ],
  imports: [
    SharedModule
  ],
  exports: [
    NavComponent,
    FooterComponent,
    HeaderComponent,
    NavWalletComponent,
    AlphaWarningComponent,
  ]
})
export class PageModule { }
