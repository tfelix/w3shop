import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { SharedModule } from 'src/app/shared/shared.module';

import { SettingsComponent } from './settings/settings.component';
import { AdminRoutingModule } from './admin-routing.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ShopModule } from '../shop/shop.module';
import { PageModule } from '../page/page.module';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { BundlrBalanceComponent } from './dashboard/bundlr-balance/bundlr-balance.component';
import { PaymentReceiverComponent } from './dashboard/payment-receiver/payment-receiver.component';

@NgModule({
  declarations: [
    SettingsComponent,
    DashboardComponent,
    BundlrBalanceComponent,
    PaymentReceiverComponent
  ],
  imports: [
    RouterModule,
    SharedModule,
    AdminRoutingModule,
    ShopModule,
    PageModule,
    BlockchainModule
  ]
})
export class AdminModule { }
