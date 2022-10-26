import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NewShopComponent } from './new-shop/new-shop.component';
import { SetupComponent } from './setup.component';
import { SuccessComponent } from './success/success.component';

const routes: Routes = [{
  path: '', component: SetupComponent,
  children: [
    { path: 'success', component: SuccessComponent },
    { path: '', component: NewShopComponent, pathMatch: 'full' },
  ]
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SetupRoutingModule { }
