import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './page/home/home.component';
import { PageComponent } from './page/page.component';

const routes: Routes = [
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
  {
    path: '', component: PageComponent,
    children: [
      { path: '', component: HomeComponent, pathMatch: 'full' },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    useHash: true,
    enableTracing: false,
    // Something in the admin.module triggers a stack overflow/infinite loop when its directly loaded.
    // I did not yet find the cause. Maybe something to do with a wallet as this is usually expected to be present
    // in the admin menu?
    // preloadingStrategy: PreloadAllModules
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
