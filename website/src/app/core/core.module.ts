import { ErrorHandler, NgModule } from '@angular/core';

import { environment } from 'src/environments/environment';

import { SharedModule } from 'src/app/shared/shared.module';

import { MockBlockchainService } from './blockchain/mock-blockchain.service';
import { WalletService } from './wallet.service';
import { BlockchainService } from './blockchain/blockchain';
import { GlobalErrorHandler } from './global-error-handler';
import { SmartContractFacade } from './contract/smart-contract-facade';
import { MockSmartContractFacade } from './contract/mock-smart-contract-facade';
import { ShopService } from './shop/shop.service';
import { ShopServiceFactory } from './shop/shop-service-factory.service';

const blockchainServiceFactory = (walletService: WalletService): BlockchainService => {
  switch (environment.injectedBlockchainService) {
    case 'mock':
      return new MockBlockchainService(walletService);
  }
}

const smartContractFacadeFactory = (): SmartContractFacade => {
  switch (environment.injectedSmartContractFacade) {
    case 'mock':
      return new MockSmartContractFacade();
  }
}

const shopServiceFactory = (shopServiceFactory: ShopServiceFactory): ShopService => {
  return shopServiceFactory.build();
}


@NgModule({
  declarations: [],
  imports: [
    SharedModule,
  ],
  providers: [
    {
      provide: 'Blockchain',
      useFactory: blockchainServiceFactory,
      deps: [WalletService]
    },
    {
      provide: 'SmartContract',
      useFactory: smartContractFacadeFactory,
    },
    {
      provide: 'Shop',
      useFactory: shopServiceFactory,
      deps: [ShopServiceFactory]
    },
    { provide: ErrorHandler, useClass: GlobalErrorHandler }
  ]
})
export class CoreModule { }
