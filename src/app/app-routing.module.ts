import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminComponent } from './admin/admin.component';
import { SetupComponent } from './setup/setup/setup.component';
import { ShopComponent } from './shop';
import { AboutComponent } from './shop/about/about.component';

const routes: Routes = [
  { path: 'setup', component: SetupComponent },
  // Maybe it makes sense to have a nested component here if there is shared parts.
  { path: ':bootstrap', component: ShopComponent },
  { path: ':bootstrap/setup', component: SetupComponent },
  { path: ':bootstrap/about', component: AboutComponent },
  { path: ':bootstrap/admin', component: AdminComponent },
  { path: ':bootstrap/admin/collection', component: AdminComponent },
  { path: ':bootstrap/admin/collection/:id', component: AdminComponent },
  { path: ':bootstrap/admin/collection/new', component: AdminComponent },
  { path: '**', redirectTo: '/setup' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
