import { Component, Input, OnInit } from '@angular/core';

import { faFilePdf, faFile, IconDefinition } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'w3s-mime-icon',
  templateUrl: './mime-icon.component.html',
})
export class MimeIconComponent implements OnInit {

  @Input()
  mimeType: string;

  mimeIcon: IconDefinition

  constructor() { }

  ngOnInit(): void {
    switch (this.mimeType) {
      case 'application/pdf':
        this.mimeIcon = faFilePdf;
        break;
      default:
        this.mimeIcon = faFile;
        break;
    }
  }

}
