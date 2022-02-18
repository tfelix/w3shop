import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AdminModule } from './admin/admin.module';
import { AppRoutingModule } from './app-routing.module';
import { SetupModule } from './setup/setup.module';
import { ShopModule } from './shop/shop.module';
import { CoreModule } from './core/core.module';
import { PageModule } from './page/page.module';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    CoreModule,
    PageModule,
    ShopModule,
    SetupModule,
    AdminModule,
    BrowserAnimationsModule,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
