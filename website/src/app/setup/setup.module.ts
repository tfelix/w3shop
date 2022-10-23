import { NgModule } from '@angular/core';

import { SharedModule } from '../shared/shared.module';

import { NewShopComponent } from './new-shop/new-shop.component';
import { SuccessComponent } from './success/success.component';
import { ExistingShopWarningComponent } from './new-shop/existing-shop-warning/existing-shop-warning.component';
import { SetupRoutingModule } from './setup-routing.module';

@NgModule({
  declarations: [
    NewShopComponent,
    SuccessComponent,
    ExistingShopWarningComponent
  ],
  imports: [
    SharedModule,
    SetupRoutingModule
  ]
})
export class SetupModule { }
