import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { BlockchainModule } from '../blockchain/blockchain.module';
import { PageModule } from '../page/page.module';
import { SharedModule } from '../shared/shared.module';
import { ToolsRoutingModule } from './tools-routing.module';
import { ToolsComponent } from './tools.component';

@NgModule({
  declarations: [
    ToolsComponent,
  ],
  imports: [
    ToolsRoutingModule,
    SharedModule,
    RouterModule,
    BlockchainModule,
    PageModule
  ]
})
export class ToolsModule { }
