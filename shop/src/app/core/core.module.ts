import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { NavComponent } from './nav/nav.component';
import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';
import { SharedModule } from '../shared/shared.module';
import { RouterModule } from '@angular/router';
import { CartComponent } from './cart/cart.component';



@NgModule({
  declarations: [
    NavComponent,
    FooterComponent,
    HeaderComponent,
    CartComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    FontAwesomeModule,
    SharedModule // Should core really import share and not the other way around?
  ],
  exports: [
    NavComponent,
    FooterComponent,
    HeaderComponent
  ],
})
export class CoreModule { }
