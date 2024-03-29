import { Component, EventEmitter, Input, Output } from '@angular/core';
import { faFileImport } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'w3s-file-dropper',
  templateUrl: './file-dropper.component.html',
  styleUrls: ['./file-dropper.component.scss']
})
export class FileDropperComponent {

  faFileImport = faFileImport;

  @Input()
  accept: string;

  @Output()
  filesDropped = new EventEmitter<FileList>();

  constructor() { }

  fileBrowseHandler(event: Event) {
    const input = event.target as HTMLInputElement;

    if (!input.files?.length) {
      return;
    }

    this.filesDropped.emit(input.files);
  }

  onFilesDropped(files: FileList) {
    this.filesDropped.emit(files);
  }
}
