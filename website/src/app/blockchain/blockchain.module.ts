import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';


import { NetworkIndicatorComponent } from './network-indicator/network-indicator.component';

@NgModule({
  declarations: [
    NetworkIndicatorComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    NetworkIndicatorComponent
  ]
})
export class BlockchainModule { }
