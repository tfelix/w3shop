import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { SharedModule } from '../shared/shared.module';

import { ItemDetailComponent } from './items/item-detail/item-detail.component';
import { PriceComponent } from './price/price.component';
import { AboutComponent } from './about/about.component';
import { ShopComponent } from './shop.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { PageModule } from '../page/page.module';
import { ShopRoutingModule } from './shop-routing.module';
import { ItemsComponent } from './items/items.component';
import { NoWalletComponent } from './no-wallet/no-wallet.component';
import { OwnedItemsComponent } from './owned-items/owned-items.component';
import { ShopErrorComponent } from './items/shop-error/shop-error.component';
import { TOKEN_CRYPTOR } from '../core';
import { ShopServiceFactory } from './shop-service-factory.service';
import { LitFileCryptorService } from './encryption/lit-file-cryptor.service';
import { MockFileCryptorService } from './encryption/mock-file-cryptor.service';
import { FileCryptorService } from './encryption/file-cryptor.service';

import { ProviderService } from 'src/app/blockchain';
import { environment } from 'src/environments/environment';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { IssueService } from './issue.service';

const cryptorServiceFactory = (
  shopServiceFactory: ShopServiceFactory,
  providerService: ProviderService
): FileCryptorService => {
  if (environment.mockPayloadEncryption) {
    return new MockFileCryptorService();
  } else {
    return new LitFileCryptorService(shopServiceFactory, providerService);
  }
}

@NgModule({
  declarations: [
    ItemDetailComponent,
    ItemsComponent,
    PriceComponent,
    AboutComponent,
    ShopComponent,
    NotFoundComponent,
    CheckoutComponent,
    ShopErrorComponent,
    NoWalletComponent,
    OwnedItemsComponent,
  ],
  imports: [
    PageModule,
    BlockchainModule,
    RouterModule,
    SharedModule,
    ShopRoutingModule
  ],
  providers: [
    {
      provide: TOKEN_CRYPTOR,
      useFactory: cryptorServiceFactory,
      deps: [ShopServiceFactory, ProviderService]
    }
  ]
})
export class ShopModule { }
