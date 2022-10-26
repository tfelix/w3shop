import { NgModule } from '@angular/core';

import { NavComponent } from './nav/nav.component';
import { FooterComponent } from './footer/footer.component';
import { CartComponent } from './cart/cart.component';
import { AlphaWarningComponent } from './alpha-warning/alpha-warning.component';
import { HeaderComponent } from './header/header.component';
import { FooterLinkComponent } from './footer-link/footer-link.component';
import { NetworkIndicatorComponent } from './network-indicator/network-indicator.component';
import { SharedModule } from '../shared/shared.module';
import { HomeComponent } from './home/home.component';
import { PrivacyComponent } from './privacy/privacy.component';
import { DisclaimerComponent } from './disclaimer/disclaimer.component';
import { LicensesComponent } from './licenses/licenses.component';
import { ShopNameComponent } from './nav/shop-name/shop-name.component';
import { NavWalletComponent } from './nav/nav-wallet/nav-wallet.component';
import { PageComponent } from './page.component';

// TODO Check if most of those used classes on every page dont not make more sense in the core module
@NgModule({
  declarations: [
    NavComponent,
    FooterComponent,
    CartComponent,
    HeaderComponent,
    HomeComponent,
    AlphaWarningComponent,
    FooterLinkComponent,
    NetworkIndicatorComponent,
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
    AlphaWarningComponent,
    NetworkIndicatorComponent
  ]
})
export class PageModule { }
