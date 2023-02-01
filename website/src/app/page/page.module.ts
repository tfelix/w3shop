import { NgModule } from '@angular/core';

import { SharedModule } from '../shared/shared.module';

import { NavComponent } from './nav/nav.component';
import { PageFooterComponent } from './page-footer/page-footer.component';
import { AlphaWarningComponent } from './alpha-warning/alpha-warning.component';
import { HeaderComponent } from './header/header.component';
import { FooterLinkComponent } from './footer-link/footer-link.component';
import { HomeComponent } from './home/home.component';
import { ShopNameComponent } from './nav/shop-name/shop-name.component';
import { PageComponent } from './page.component';

@NgModule({
  declarations: [
    NavComponent,
    PageFooterComponent,
    HeaderComponent,
    HomeComponent,
    AlphaWarningComponent,
    FooterLinkComponent,
    ShopNameComponent,
    PageComponent,
  ],
  imports: [
    SharedModule
  ],
  exports: [
    NavComponent,
    ShopNameComponent,
    HeaderComponent,
    AlphaWarningComponent,
  ]
})
export class PageModule { }
