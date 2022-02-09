import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { Web3ModalModule, Web3ModalService } from '@mindsorg/web3modal-angular';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SetupModule } from './setup/setup.module';
import { ShopModule } from './shop/shop.module';

@NgModule({
  declarations: [
    AppComponent,

  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    Web3ModalModule,
    ShopModule,
    SetupModule
  ],
  providers: [
    {
      provide: Web3ModalService,
      useFactory: () => {
        return new Web3ModalService({
          disableInjectedProvider: false,
          network: "mainnet", // optional
          cacheProvider: true, // optional
          providerOptions: {} // required,
        });
      },
    },

  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
