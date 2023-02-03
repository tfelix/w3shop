import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NetworkIndicatorComponent } from './network-indicator/network-indicator.component';
import { WalletComponent } from './wallet/wallet.component';
import { SharedModule } from '../shared/shared.module';
import { PriceComponent } from './price/price.component';

@NgModule({
  declarations: [
    NetworkIndicatorComponent,
    WalletComponent,
    PriceComponent
  ],
  imports: [
    CommonModule,
    SharedModule
  ],
  exports: [
    NetworkIndicatorComponent,
    WalletComponent,
    PriceComponent
  ]
})
export class BlockchainModule { }
