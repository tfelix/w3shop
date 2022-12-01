import { inject, InjectionToken } from "@angular/core";
import { environment } from "src/environments/environment";
import { BundlrUploadService } from "./bundlr-upload.service";
import { BundlrService } from "./bundlr.service";
import { MockUploadService } from "./mock-upload.service";
import { UploadService } from "./upload.service";

export const UPLOAD_SERVICE_TOKEN = new InjectionToken<UploadService>('Upload service', {
  providedIn: 'root',
  factory: () => {
    if (!environment.production) {
      console.debug('Injecting MockUploadService');
      return new MockUploadService();
    } else {
      console.debug('Injecting BundlrUploadService');
      return new BundlrUploadService(inject(BundlrService));
    }
  }
});