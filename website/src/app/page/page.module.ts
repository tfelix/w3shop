import { NgModule } from '@angular/core';

import { SharedModule } from '../shared/shared.module';

import { NavComponent } from './nav/nav.component';
import { FooterComponent } from './footer/footer.component';
import { AlphaWarningComponent } from './alpha-warning/alpha-warning.component';
import { HeaderComponent } from './header/header.component';
import { FooterLinkComponent } from './footer-link/footer-link.component';
import { HomeComponent } from './home/home.component';
import { PrivacyComponent } from './privacy/privacy.component';
import { DisclaimerComponent } from './disclaimer/disclaimer.component';
import { LicensesComponent } from './licenses/licenses.component';
import { ShopNameComponent } from './nav/shop-name/shop-name.component';
import { PageComponent } from './page.component';
import { UsagePolicyComponent } from './usage-policy/usage-policy.component';

@NgModule({
  declarations: [
    NavComponent,
    FooterComponent,
    HeaderComponent,
    HomeComponent,
    AlphaWarningComponent,
    FooterLinkComponent,
    PrivacyComponent,
    DisclaimerComponent,
    LicensesComponent,
    ShopNameComponent,
    PageComponent,
    UsagePolicyComponent
  ],
  imports: [
    SharedModule
  ],
  exports: [
    NavComponent,
    FooterComponent,
    HeaderComponent,
    AlphaWarningComponent,
  ]
})
export class PageModule { }
