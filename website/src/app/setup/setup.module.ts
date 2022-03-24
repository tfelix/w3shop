import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NewShopComponent } from './new-shop/new-shop.component';
import { HomeComponent } from './home/home.component';
import { SharedModule } from '../shared/shared.module';


@NgModule({
  declarations: [
    NewShopComponent,
    HomeComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
  ]
})
export class SetupModule { }
