import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Web3ModalModule, Web3ModalService } from '@mindsorg/web3modal-angular';

import { NavComponent } from './nav/nav.component';
import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';
import { SharedModule } from '../shared/shared.module';
import { RouterModule } from '@angular/router';



@NgModule({
  declarations: [
    NavComponent,
    FooterComponent,
    HeaderComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    Web3ModalModule,
    SharedModule // Should core really import share and not the other way around?
  ],
  exports: [
    NavComponent,
    FooterComponent,
    HeaderComponent
  ],
  // This is the metamask connect setup.
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
})
export class CoreModule { }
