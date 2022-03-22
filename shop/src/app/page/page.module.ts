import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { NavComponent } from './nav/nav.component';
import { FooterComponent } from './footer/footer.component';
import { CartComponent } from './cart/cart.component';
import { AlphaWarningComponent } from './alpha-warning/alpha-warning.component';
import { HeaderComponent } from './header/header.component';
import { FooterLinkComponent } from './footer-link/footer-link.component';
import { NetworkIndicatorComponent } from './network-indicator/network-indicator.component';


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
    CommonModule,
    RouterModule,
    FontAwesomeModule,
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
