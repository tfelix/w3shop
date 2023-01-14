import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OwnedItemsComponent } from './owned-items.component';


const routes: Routes = [
  {
    path: '',
    component: OwnedItemsComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OwnedItemsRoutingModule { }
