import { NgModule } from '@angular/core';

import { NewShopComponent } from './new-shop/new-shop.component';
import { HomeComponent } from './home/home.component';
import { SharedModule } from '../shared/shared.module';
import { DeployProgressComponent } from './new-shop/deploy-progress/deploy-progress.component';


@NgModule({
  declarations: [
    NewShopComponent,
    HomeComponent,
    DeployProgressComponent
  ],
  imports: [
    SharedModule,
  ]
})
export class SetupModule { }
