import { Component, Inject, OnInit } from '@angular/core';
import { from } from 'rxjs';
import { map, mergeMap, pluck, tap } from 'rxjs/operators';
import { UploadService, UPLOAD_SERVICE_TOKEN } from '../blockchain';
import { ShopError } from '../core';
import { filterNotNull } from '../shared';

interface FileInfo {
  fileSizeBytes: number;
  lastModified: Date;
  type: string;
  fileName: string;
}

interface ArweaveUploadInfo {
  txId: string;
  gatewayUri: string;
}

@Component({
  selector: 'w3s-tools',
  templateUrl: './tools.component.html',
  styleUrls: ['./tools.component.scss']
})
export class ToolsComponent implements OnInit {

  constructor(
    @Inject(UPLOAD_SERVICE_TOKEN) private readonly uploadService: UploadService
  ) { }

  fileInfo: FileInfo | null = null;
  uploadInfo: ArweaveUploadInfo | null = null;
  loadedFile: File | null = null;

  ngOnInit(): void {
  }

  onFileContentChange(files: FileList) {
    if (files.length === 0) {
      this.fileInfo = null;
      this.loadedFile = null;
      return;
    }

    if (files.length != 1) {
      return;
    }

    const file = files[0];

    this.fileInfo = {
      fileName: file.name,
      fileSizeBytes: file.size,
      lastModified: new Date(file.lastModified),
      type: file.type
    };

    this.loadedFile = file;
  }

  uploadFile() {
    if (!this.loadedFile) {
      return;
    }

    this.uploadService.uploadFile(this.loadedFile).pipe(
      tap(x => console.log(x)),
      pluck('fileId'),
      filterNotNull()
    ).subscribe(fileId => {
      this.uploadInfo = {
        txId: fileId as string,
        gatewayUri: 'https://arweave.net/' + fileId
      }
    }, err => {
      this.uploadInfo = null;
      throw new ShopError('Error while uploading the file', err);
    });
  }
}
