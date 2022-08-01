import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

import { saveAs } from 'file-saver';

import { Download, FileDownloadService } from "./file-download.service";
import { LitFileCryptorService } from "src/app/core";

@Injectable({
  providedIn: 'root'
})
export class OwnedItemService {

  constructor(
    private fileDownloadService: FileDownloadService,
    private cryptorService: LitFileCryptorService
  ) { }

  download(url: string, mime: string, filename: string): Observable<Download> {
    return this.fileDownloadService.download(url).pipe(
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