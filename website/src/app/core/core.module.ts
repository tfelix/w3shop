import { ErrorHandler, NgModule, Optional, SkipSelf } from '@angular/core';

import { SharedModule } from 'src/app/shared/shared.module';

import { GlobalErrorHandler } from './global-error-handler';
import { UploadService } from './upload/upload.service';
import { environment } from 'src/environments/environment';
import { MockUploadService } from './upload/mock-upload.service';
import { BundlrUploadService } from './upload/bundlr-upload.service';
import { ProviderService } from './blockchain/provider.service';
import { FileCryptorService } from './encryption/file-cryptor.service';
import { LitFileCryptorService } from './encryption/lit-file-cryptor.service';
import { ShopServiceFactory } from './shop/shop-service-factory.service';
import { MockFileCryptorService } from './encryption/mock-file-cryptor.service copy';
import { TOKEN_CRYPTOR, TOKEN_UPLOAD } from './inject-tokens';

const uploadServiceFactory = (providerService: ProviderService): UploadService => {
  if (environment.mockFileUpload) {
    return new MockUploadService();
  } else {
    return new BundlrUploadService(providerService);
  }
}

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
  declarations: [],
  imports: [
    SharedModule,
  ],
  providers: [
    {
      provide: TOKEN_UPLOAD,
      useFactory: uploadServiceFactory,
      deps: [ProviderService]
    },
    {
      provide: TOKEN_CRYPTOR,
      useFactory: cryptorServiceFactory,
      deps: [ShopServiceFactory, ProviderService]
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
