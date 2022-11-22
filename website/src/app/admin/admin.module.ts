import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { SharedModule } from 'src/app/shared/shared.module';

import { NewCollectionComponent } from './new-collection/new-collection.component';
import { EditCollectionComponent } from './edit-collection/edit-collection.component';
import { SettingsComponent } from './settings/settings.component';
import { NewItemComponent } from './new-item/new-item.component';
import { AdminComponent } from './admin.component';
import { AdminRoutingModule } from './admin-routing.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ShopModule } from '../shop/shop.module';
import { PageModule } from '../page/page.module';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { BundlrBalanceComponent } from './dashboard/bundlr-balance/bundlr-balance.component';
import { PaymentReceiverComponent } from './dashboard/payment-receiver/payment-receiver.component';

@NgModule({
  declarations: [
    AdminComponent,
    NewCollectionComponent,
    NewItemComponent,
    EditCollectionComponent,
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
