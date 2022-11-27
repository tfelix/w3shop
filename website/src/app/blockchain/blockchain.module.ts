import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NetworkIndicatorComponent } from './network-indicator/network-indicator.component';
import { WalletComponent } from './wallet/wallet.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [
    NetworkIndicatorComponent,
    WalletComponent
  ],
  imports: [
    CommonModule,
    SharedModule
  ],
  exports: [
    NetworkIndicatorComponent,
    WalletComponent
  ]
})
export class BlockchainModule { }
