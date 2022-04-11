import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NewShopComponent } from './new-shop/new-shop.component';
import { SuccessComponent } from './success/success.component';

const routes: Routes = [
  { path: 'setup', component: NewShopComponent },
  { path: 'setup/success', component: SuccessComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SetupRoutingModule { }
