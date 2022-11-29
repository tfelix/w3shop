import { Observable, of } from "rxjs";
import { delay } from "rxjs/operators";

import { Injectable } from "@angular/core";
import { EncryptedFileMeta, FileCryptorService } from "./file-cryptor.service";

@Injectable({
  providedIn: 'root'
})
export class MockFileCryptorService implements FileCryptorService {

  encryptPayloadFile(
    file: File,
    nextTokenId: string,
  ): Observable<EncryptedFileMeta> {
    return of({
      encryptedKeyBase64: 'abcdefgh',
      accessCondition: {},
      encryptedFile: null
    }).pipe(delay(2000));
  }

  decryptPayloadFile(
    encryptedFile: Blob,
    encryptedKeyBase64: string,
    accessConditionBase64: string
  ): Observable<Blob> {
    let file;
    if (encryptedFile instanceof File) {
      file = encryptedFile;
    } else {
      file = new File([encryptedFile], "filename.txt");
    }

    throw new Error('Not implemented');
  }
}