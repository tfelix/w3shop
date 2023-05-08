import { inject, InjectionToken } from '@angular/core';
import { environment } from 'src/environments/environment';
import { MockUploadService } from './mock-upload.service';
import { UploadService } from './upload.service';

export const UPLOAD_SERVICE_TOKEN = new InjectionToken<UploadService>('Upload service', {
  providedIn: 'root',
  factory: () => {
    if (environment.production) {
      console.debug('Injecting BundlrUploadService');
      // return new BundlrUploadService(inject(BundlrService));
      return new MockUploadService();
    } else {
      console.debug('Injecting MockUploadService');
      return new MockUploadService();
    }
  }
});