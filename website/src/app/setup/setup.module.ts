import { NgModule } from '@angular/core';

import { SharedModule } from '../shared/shared.module';

import { NewShopComponent } from './new-shop/new-shop.component';
import { SuccessComponent } from './success/success.component';
import { ExistingShopWarningComponent } from './new-shop/existing-shop-warning/existing-shop-warning.component';
import { SetupRoutingModule } from './setup-routing.module';
import { SetupComponent } from './setup.component';

import { PageModule } from 'src/app/page/page.module';
import { BlockchainModule } from 'src/app/blockchain/blockchain.module';

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
    PageModule,
    BlockchainModule
  ]
})
export class SetupModule { }
