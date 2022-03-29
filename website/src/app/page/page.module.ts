import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { NavComponent } from './nav/nav.component';
import { FooterComponent } from './footer/footer.component';
import { CartComponent } from './cart/cart.component';
import { AlphaWarningComponent } from './alpha-warning/alpha-warning.component';
import { HeaderComponent } from './header/header.component';
import { FooterLinkComponent } from './footer-link/footer-link.component';
import { NetworkIndicatorComponent } from './network-indicator/network-indicator.component';
import { SharedModule } from '../shared/shared.module';


@NgModule({
  declarations: [
    NavComponent,
    FooterComponent,
    CartComponent,
    HeaderComponent,
    AlphaWarningComponent,
    FooterLinkComponent,
    NetworkIndicatorComponent
  ],
  imports: [
    RouterModule,
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
