import { inject, InjectionToken } from "@angular/core";
import { ProviderService } from "src/app/blockchain";
import { environment } from "src/environments/environment";

import { ShopServiceFactory } from "../shop-service-factory.service";
import { FileCryptorService } from "./file-cryptor.service";
import { LitFileCryptorService } from "./lit-file-cryptor.service";
import { MockFileCryptorService } from "./mock-file-cryptor.service";

export const ENCRYPTION_SERVICE_TOKEN = new InjectionToken<FileCryptorService>('Encryption service', {
  providedIn: 'root',
  factory: () => {
    if (environment.mockPayloadEncryption) {
      console.debug('Injecting MockFileCryptorService');
      return new MockFileCryptorService();
    } else {
      console.debug('Injecting LitFileCryptorService');
      return new LitFileCryptorService(inject(ShopServiceFactory), inject(ProviderService));
    }
  },
});