import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgWizardService } from 'ng-wizard';
import { ShopError } from 'src/app/core';


interface EncryptedFile {
  encryptedZip: Blob;
  symmetricKey: Uint8Array[32];
}

interface FileInfo {
  fileSizeBytes: number;
  lastModified: Date;
  type: string;
  fileName: string;
}

@Component({
  templateUrl: './new-item.component.html',
})
export class NewItemComponent {

  // https://blog.angular-university.io/angular-file-upload/

  newItemForm = this.fb.group({
    step1: this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      price: ['', Validators.required],
    }),
    step2: this.fb.group({
      nftImage: ['', Validators.required],
      contentFile: ['', Validators.required],
    })
  });

  tags: string[] = [];

  thumbnailImgData: ArrayBuffer | null = null;
  fileInfo: FileInfo | null = null;

  get f() {
    return this.newItemForm.controls;
  }

  constructor(
    private readonly fb: FormBuilder,
    private ngWizardService: NgWizardService
  ) { }

  private addTranslation(): FormGroup {
    return this.fb.group({
      languageCode: ['', Validators.required],
      name: ['', Validators.required],
      description: ['', Validators.required],
    });
  }

  isValidStep1(): boolean {
    return this.newItemForm.get('step1').valid;
  }

  isValidStep2(): boolean {
    return this.newItemForm.get('step2').valid;
  }

  onFileNftImageChange(files: FileList) {
    if (files.length === 0) {
      return;
    }

    if (files.length != 1) {
      return;
    }

    const file = files[0];

    if (file.type.match(/image\/*/) == null) {
      throw new ShopError('Chosen file is not an image');
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (_event) => {
      this.thumbnailImgData = reader.result as ArrayBuffer;
    };
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

  stepChanged(event) {

  }
}
