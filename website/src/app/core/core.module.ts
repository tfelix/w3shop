import { ErrorHandler, NgModule, Optional, SkipSelf } from '@angular/core';

import { SharedModule } from 'src/app/shared/shared.module';

import { GlobalErrorHandler } from './global-error-handler';
import { ShopService } from './shop/shop.service';
import { ShopServiceFactory } from './shop/shop-service-factory.service';
import { UploadService } from './upload/upload.service';
import { environment } from 'src/environments/environment';
import { MockUploadService } from './upload/mock-upload.service';
import { BundlrUploadService } from './upload/bundlr-upload.service';
import { ProviderService } from './blockchain/provider.service';

const uploadServiceFactory = (providerService: ProviderService): UploadService => {
  if (environment.mockFileUpload) {
    return new MockUploadService();
  } else {
    return new BundlrUploadService(providerService);
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
      provide: 'Upload',
      useFactory: uploadServiceFactory,
      deps: [ProviderService]
    },
    {
      // TODO Maybe put this in the shop module?
      provide: 'Shop',
      useFactory: shopServiceFactory,
      deps: [ShopServiceFactory]
    },
    { provide: ErrorHandler, useClass: GlobalErrorHandler }
  ]
})
export class CoreModule {

  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error(`CoreModule has already been loaded. Import Core modules in the AppModule only.`);
    }
  }
}
