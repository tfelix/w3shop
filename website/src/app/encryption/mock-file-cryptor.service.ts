import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

import { Injectable } from '@angular/core';
import { EncryptedFileMeta, FileCryptorService } from './file-cryptor.service';
import { MockUploadService } from '../updload';

@Injectable({
  providedIn: 'root'
})
export class MockFileCryptorService implements FileCryptorService {

  encryptPayloadFile(
    _0: File,
    _1: string,
  ): Observable<EncryptedFileMeta> {
    return of({
      encryptedKeyBase64: 'abcdefgh',
      accessCondition: {},
      accessConditionBase64: 'abcdefgh',
      encryptedFile: new Blob([MockUploadService.MOCK_ARWEAVE_PAYLOAD_CONTENT], { type: 'text/plain' })
    }).pipe(delay(2000));
  }

  decryptPayloadFile(
    encryptedFile: Blob,
    _0: string,
    _1: string
  ): Observable<Blob> {
    let file;
    if (encryptedFile instanceof File) {
      file = encryptedFile;
    } else {
      file = new File([encryptedFile], 'filename.txt');
    }

    throw new Error('Not implemented');
  }
}