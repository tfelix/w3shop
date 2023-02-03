import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CheckoutRoutingModule } from './checkout-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { CheckoutComponent } from './checkout.component';
import { BlockchainModule } from 'src/app/blockchain/blockchain.module';


@NgModule({
  declarations: [
    CheckoutComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    BlockchainModule,
    CheckoutRoutingModule,
  ]
})
export class CheckoutModule { }
