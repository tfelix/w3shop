import { NgModule } from '@angular/core';

import { SharedModule } from '../shared/shared.module';

import { NewShopComponent } from './new-shop/new-shop.component';
import { DeployProgressComponent } from './new-shop/deploy-progress/deploy-progress.component';
import { SuccessComponent } from './success/success.component';
import { ExistingShopWarningComponent } from './new-shop/existing-shop-warning/existing-shop-warning.component';

@NgModule({
  declarations: [
    NewShopComponent,
    DeployProgressComponent,
    SuccessComponent,
    ExistingShopWarningComponent
  ],
  imports: [
    SharedModule,
  ]
})
export class SetupModule { }
