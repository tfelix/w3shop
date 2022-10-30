import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

import { saveAs } from 'file-saver';

import { FileClientFactory } from "src/app/core";
import { Download } from "src/app/core/file-client/file-client";
import { LitFileCryptorService } from "../encryption/lit-file-cryptor.service";

@Injectable({
  providedIn: 'root'
})
export class ItemDownloadService {

  constructor(
    private fileClientFactory: FileClientFactory,
    private cryptorService: LitFileCryptorService
  ) { }

  download(url: string, mime: string, filename: string): Observable<Download> {
    const fileClient = this.fileClientFactory.getResolver(url);

    return fileClient.download(url).pipe(
      tap(download => this.decryptAndSave(download, mime, filename))
    );
  }

  private decryptAndSave(download: Download, mime: string, filename: string) {
    if (!!download.content) {
      return;
    }

    this.cryptorService.decryptFile(download.content).subscribe(
      zip => {
        const blob = new Blob([zip.decryptedFile], { type: mime });
        saveAs(blob, filename);
      }
    )
  }
}