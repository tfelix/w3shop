import { ErrorHandler, NgModule } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from 'src/environments/environment';

import { SharedModule } from 'src/app/shared/shared.module';

import { MockBlockchainService } from './blockchain/mock-blockchain.service';
import { MockDatabase } from './database/mock-database';
import { CeramicKeyAuthenticatorService } from './database/ceramic/ceramic-key-auth.service';
import { WalletService } from './wallet.service';
import { CeramicNftAuthService } from './database/ceramic/ceramic-nft-auth.service';
import { DatabaseService } from './database/database';
import { CeramicAuthenticator } from './database/ceramic/ceramic-authenticator';
import { BlockchainService } from './blockchain/blockchain';
import { GlobalErrorHandler } from './global-error-handler';

const blockchainServiceFactory = (walletService: WalletService): BlockchainService => {
  switch (environment.injectedBlockchainService) {
    case 'mock':
      return new MockBlockchainService(walletService);
  }
}

const ceramicAuthFactory = (): CeramicAuthenticator => {
  switch (environment.injectedCeramicAuthenticator) {
    case 'key':
      return new CeramicKeyAuthenticatorService();
    case 'nft':
      return new CeramicNftAuthService();
  }
}

const databaseServiceFactory = (httpClient: HttpClient): DatabaseService => {
  switch (environment.injectedDatabaseService) {
    case 'mock':
      return new MockDatabase(httpClient);
  }
}


@NgModule({
  declarations: [],
  imports: [
    SharedModule,
  ],
  providers: [
    {
      provide: 'CeramicAuthenticator',
      useFactory: ceramicAuthFactory
    },
    {
      provide: 'Blockchain',
      useFactory: blockchainServiceFactory,
      deps: [WalletService]
    },
    {
      provide: 'Database',
      useFactory: databaseServiceFactory,
      deps: [HttpClient]
    },
    { provide: ErrorHandler, useClass: GlobalErrorHandler }
  ]
})
export class CoreModule { }
