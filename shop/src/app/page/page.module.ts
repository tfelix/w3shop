import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { NavComponent } from './nav/nav.component';
import { FooterComponent } from './footer/footer.component';
import { CartComponent } from './cart/cart.component';
import { AlphaWarningComponent } from './alpha-warning/alpha-warning.component';
import { HeaderComponent } from './header/header.component';


@NgModule({
  declarations: [
    NavComponent,
    FooterComponent,
    HeaderComponent,
    CartComponent,
    AlphaWarningComponent
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
    AlphaWarningComponent
  ]
})
export class PageModule { }
