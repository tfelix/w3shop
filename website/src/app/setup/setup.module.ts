import { NgModule } from '@angular/core';

import { NewShopComponent } from './new-shop/new-shop.component';
import { HomeComponent } from './home/home.component';
import { SharedModule } from '../shared/shared.module';


@NgModule({
  declarations: [
    NewShopComponent,
    HomeComponent
  ],
  imports: [
    SharedModule,
  ]
})
export class SetupModule { }
