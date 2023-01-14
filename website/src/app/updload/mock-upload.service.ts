import { Observable, of } from 'rxjs';

import { UploadProgress, ProgressStage, UploadService } from './upload.service';

export class MockUploadService implements UploadService {

  constructor(
  ) {
  }

  fund(nBytes: number): Observable<string> {
    console.info(`Funding for ${nBytes} bytes of upload`);

    return of('FUNDING_TX');
  }

  getUploadableBytesCount(): Observable<number> {
    return of(10 * 1024 ** 2);
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
      console.info('Fake MOCK_ARWAVE_SHOP_CONFIG_HASH upload detected');
      responseArweaveId = MockUploadService.MOCK_ARWAVE_SHOP_CONFIG_HASH;
    } else {
      console.info('Fake MOCK_ARWAVE_NFT_HASH upload detected');
      responseArweaveId = MockUploadService.MOCK_ARWAVE_NFT_HASH;
    }

    return this.makeProgress(100, ProgressStage.COMPLETE, responseArweaveId);
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

  static readonly MOCK_ARWAVE_SHOP_CONFIG_HASH = 'ar://CONFIGCONFIGCONFIGCONFIGCONF';
  static readonly MOCK_ARWAVE_NFT_HASH = 'ar://NFTHASHNFTHASHFTHASHFTHASHFT';
}