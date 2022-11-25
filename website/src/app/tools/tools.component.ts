import { Component, OnInit } from '@angular/core';

interface FileInfo {
  fileSizeBytes: number;
  lastModified: Date;
  type: string;
  fileName: string;
}

@Component({
  selector: 'w3s-tools',
  templateUrl: './tools.component.html',
  styleUrls: ['./tools.component.scss']
})
export class ToolsComponent implements OnInit {

  constructor() { }

  fileInfo: FileInfo | null = null;

  ngOnInit(): void {
  }

  onFileContentChange(files: FileList) {
    if (files.length === 0) {
      this.fileInfo = null;
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
  }

  uploadFile() {

  }
}
