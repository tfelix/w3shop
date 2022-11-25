import { Observable, of } from "rxjs";
import { delay } from "rxjs/operators";

import { Injectable } from "@angular/core";
import { DecryptedZip, EncryptedZipWithMetadata, FileCryptorService } from "./file-cryptor.service";

@Injectable({
  providedIn: 'root'
})
export class MockFileCryptorService implements FileCryptorService {

  encryptPayloadFile(
    file: File,
    nextTokenId: string,
  ): Observable<EncryptedZipWithMetadata> {
    return of({ zipBlob: file }).pipe(delay(2000));
  }

  decryptFile(encryptedFile: File | Blob): Observable<DecryptedZip> {
    let file;
    if (encryptedFile instanceof File) {
      file = encryptedFile;
    } else {
      file = new File([encryptedFile], "filename.txt");
    }

    return of({ decryptedFile: file, metadata: '' }).pipe(delay(2000));
  }
}