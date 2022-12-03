import { concat, Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

import { UploadProgress, ProgressStage, UploadService } from './upload.service';

export class MockUploadService implements UploadService {

  constructor(
  ) {
  }

  uploadBlob(_: Blob): Observable<UploadProgress> {
    return this.mockUpload('Blob');
  }

  uploadJson(data: string): Observable<UploadProgress> {
    return this.mockUpload(data);
  }

  uploadFile(file: File): Observable<UploadProgress> {
    return this.mockUpload(file.name);
  }

  private mockUpload(data: string): Observable<UploadProgress> {
    console.debug(`deployFiles: Mocking upload of ${data.length} bytes`, data);

    // Check expected upload value
    const isShopConfig = data.indexOf('shopName') !== -1;
    let responseArweaveId;
    if (isShopConfig) {
      responseArweaveId = MockUploadService.MOCK_ARWAVE_SHOP_CONFIG_HASH;
    } else {
      responseArweaveId = MockUploadService.MOCK_ARWAVE_NFT_HASH;
    }

    return concat(
      this.makeProgress(10, ProgressStage.SIGN_IN).pipe(delay(2000)),
      this.makeProgress(30, ProgressStage.FUND).pipe(delay(2000)),
      this.makeProgress(50, ProgressStage.UPLOAD).pipe(delay(2000)),
      this.makeProgress(100, ProgressStage.COMPLETE, responseArweaveId)
    );
  }

  getCurrentBalance(): Observable<string> {
    return of('0.0');
  }

  private makeProgress(
    progress: number,
    stage: ProgressStage,
    fileId?: string
  ): Observable<UploadProgress> {
    return of({
      progress,
      stage,
      fileId,
    });
  }

  bytesToUpload(): Observable<number> {
    return of(1000);
  }

  fund(nBytes: number): Observable<void> {
    console.info(`Funding for ${nBytes} bytes of upload`);

    return of();
  }

  static readonly MOCK_ARWAVE_SHOP_CONFIG_HASH = 'ar://CONFIGCONFIGCONFIGCONFIGCONF';
  static readonly MOCK_ARWAVE_NFT_HASH = 'BBBBBBBBBBBBBBBBBBBBBBBBBBBB';
}