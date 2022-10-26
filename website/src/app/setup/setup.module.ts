import { NgModule } from '@angular/core';

import { SharedModule } from '../shared/shared.module';

import { NewShopComponent } from './new-shop/new-shop.component';
import { SuccessComponent } from './success/success.component';
import { ExistingShopWarningComponent } from './new-shop/existing-shop-warning/existing-shop-warning.component';
import { SetupRoutingModule } from './setup-routing.module';
import { PageModule } from '../page/page.module';
import { SetupComponent } from './setup.component';

@NgModule({
  declarations: [
    NewShopComponent,
    SuccessComponent,
    ExistingShopWarningComponent,
    SetupComponent
  ],
  imports: [
    SharedModule,
    SetupRoutingModule,
    PageModule
  ]
})
export class SetupModule { }
