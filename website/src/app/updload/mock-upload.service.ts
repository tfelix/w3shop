import { from, Observable, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

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

  uploadBlob(data: Blob): Observable<UploadProgress> {
    return from(data.text()).pipe(
      mergeMap(str => this.mockUpload(str))
    );
  }

  uploadJson(data: string): Observable<UploadProgress> {
    return this.mockUpload(data);
  }

  uploadFile(file: File): Observable<UploadProgress> {
    return this.mockUpload(file.name);
  }

  private mockUpload(data: string): Observable<UploadProgress> {
    console.debug(`deployFiles: Mocking upload of ${data.length} bytes`);

    // Check expected upload value
    const isShopConfig = data.indexOf('shopName') !== -1;
    const isNftMeta = data.indexOf('attributes') !== -1;
    const isShopItemMeta = data.indexOf('price') !== -1;
    const isFilePayload = data === MockUploadService.MOCK_ARWEAVE_PAYLOAD_CONTENT;
    let responseArweaveId;

    if (isShopConfig) {
      console.info('Fake MOCK_ARWAVE_SHOP_CONFIG_HASH upload detected');
      responseArweaveId = MockUploadService.MOCK_ARWEAVE_SHOP_CONFIG_HASH;
    } else if (isFilePayload) {
      console.info('Fake MOCK_ARWEAVE_PAYLOAD_HASH upload detected');
      responseArweaveId = MockUploadService.MOCK_ARWEAVE_PAYLOAD_HASH;
    } else if (isNftMeta) {
      console.info('Fake MOCK_ARWEAVE_NFT_HASH upload detected');
      responseArweaveId = MockUploadService.MOCK_ARWEAVE_NFT_HASH;
    } else if (isShopItemMeta) {
      console.info('Fake MOCK_ARWEAVE_ITEM_META_HASH upload detected');
      responseArweaveId = MockUploadService.MOCK_ARWEAVE_ITEM_META_HASH;
    } else {
      console.info('Fake MOCK_ARWEAVE_THUMBNAIL_HASH upload detected');
      responseArweaveId = MockUploadService.MOCK_ARWEAVE_THUMBNAIL_HASH;
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

  static readonly MOCK_ARWEAVE_PAYLOAD_CONTENT = 'PAYLOAD';

  static readonly MOCK_ARWEAVE_SHOP_CONFIG_HASH = 'ar://CONFIGCONFIGCONFIGCONFIGCONF';
  static readonly MOCK_ARWEAVE_PAYLOAD_HASH = 'ar://PAYLOADPAYLOADPAYLOADPAYLOAD';
  static readonly MOCK_ARWEAVE_THUMBNAIL_HASH = 'ar://THUMBNAILTHUMBNAILTHUMBNAIL';
  static readonly MOCK_ARWEAVE_NFT_HASH = 'ar://NFTHASHNFTHASHFTHASHFTHASHFT';
  static readonly MOCK_ARWEAVE_ITEM_META_HASH = 'ar://ITEMMETAHASHITEMMETAHASHITEM';
}