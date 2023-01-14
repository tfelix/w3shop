import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { saveAs } from 'file-saver';

import { OwnedItem } from './owned-items.service';
import { Download, FileClientFactory } from 'src/app/blockchain';
import { ENCRYPTION_SERVICE_TOKEN, FileCryptorService } from 'src/app/encryption';

@Injectable({
  providedIn: 'root'
})
export class ItemDownloadService {

  constructor(
    private fileClientFactory: FileClientFactory,
    @Inject(ENCRYPTION_SERVICE_TOKEN) private cryptorService: FileCryptorService
  ) { }

  download(downloadItem: OwnedItem): Observable<Download> {
    console.log('Downloading: ', downloadItem);

    // TODO this is a bit cumbersome, better would be to directly start the download depending
    //   on the URI and ditch this fileClient creation/resolver thing.
    const fileClient = this.fileClientFactory.getResolver(downloadItem.file.uri);

    return fileClient.download(downloadItem.file.uri).pipe(
      tap(download => console.log(download)),
      tap(download => {
        if (download.content) {
          this.decryptAndSave(download.content, downloadItem);
        }
      })
    );
  }

  private decryptAndSave(blob: Blob, downloadItem: OwnedItem) {
    this.cryptorService.decryptPayloadFile(
      blob,
      downloadItem.file.encryptedKey,
      downloadItem.file.accessCondition
    ).subscribe(decryptedBlob => {
      saveAs(decryptedBlob, downloadItem.file.filename);
    });
  }
}