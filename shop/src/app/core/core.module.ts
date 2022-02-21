import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CeramicKeyAuthenticatorService } from './ceramic/ceramic-key-auth.service';
import { MockBlockchainService } from './blockchain/mock-blockchain.service';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
  ],
  providers: [
    {
      provide: 'CeramicAuthenticator',
      useClass: CeramicKeyAuthenticatorService // Make this configurable via the environment file.
    },
    {
      provide: 'Blockchain',
      useClass: MockBlockchainService // Make this configurable via the environment file.
    }
  ]
})
export class CoreModule { }
