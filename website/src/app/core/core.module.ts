import { ErrorHandler, NgModule } from '@angular/core';

import { environment } from 'src/environments/environment';

import { SharedModule } from 'src/app/shared/shared.module';

import { GlobalErrorHandler } from './global-error-handler';
import { SmartContractFacade } from './contract/smart-contract-facade';
import { MockSmartContractFacade } from './contract/mock-smart-contract-facade';
import { ShopService } from './shop/shop.service';
import { ShopServiceFactory } from './shop/shop-service-factory.service';

/*
const blockchainServiceFactory = (walletService: WalletService): BlockchainService => {
  if (environment.injectMocks) {
    return new MockBlockchainService(walletService);
  } else {
    throw new Error('Not implemented');
  }
}*/

const smartContractFacadeFactory = (): SmartContractFacade => {
  if (environment.injectMocks) {
    return new MockSmartContractFacade();
  } else {
    throw new Error('Not implemented');
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
   /* {
      provide: 'Blockchain',
      useFactory: blockchainServiceFactory,
      deps: [WalletService]
    },*/
    {
      provide: 'SmartContract',
      useFactory: smartContractFacadeFactory,
    },
    {
      // Maybe put this in the shop module?
      provide: 'Shop',
      useFactory: shopServiceFactory,
      deps: [ShopServiceFactory]
    },
    { provide: ErrorHandler, useClass: GlobalErrorHandler }
  ]
})
export class CoreModule { }
