import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './page/home/home.component';
import { PageComponent } from './page/page.component';

const routes: Routes = [
  {
    path: '', component: PageComponent,
    children: [
      { path: '', component: HomeComponent, pathMatch: 'full' },
    ]
  },
  {
    path: 'legal',
    loadChildren: () => import('./legal/legal.module').then(m => m.LegalModule)
  },
  {
    path: 'setup',
    loadChildren: () => import('./setup/setup.module').then(m => m.SetupModule)
  },
  {
    path: 's/:bootstrap',
    loadChildren: () => import('./shop/shop.module').then(m => m.ShopModule)
  },
  {
    path: 'tools',
    loadChildren: () => import('./tools/tools.module').then(m => m.ToolsModule)
  },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)], // enable tracing with { enableTracing: true }
  exports: [RouterModule]
})
export class AppRoutingModule { }
