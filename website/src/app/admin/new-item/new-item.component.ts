import { Component } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { ethers } from 'ethers';
import { ShopError } from 'src/app/core';
import { NewShopItemService, NewShopItemSpec } from './new-shop-item.service';

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
    private readonly fb: UntypedFormBuilder,
    private readonly newShopItemService: NewShopItemService,
  ) { }

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
      // Put out the image data
      this.thumbnailImgData = reader.result as ArrayBuffer;
    };

    this.newItemForm.patchValue({ step2: { nftImage: file } });
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

    if (files.length > 0) {
      this.newItemForm.patchValue({ step2: { contentFile: file } });
    }
  }

  private isCreationStep(stepIndex: number) {
    return stepIndex === 2;
  }

  private makeNewItemSpec(): NewShopItemSpec {
    const formValue = this.newItemForm.value;

    // Fix the entered price info into the right format without decimal
    const parsedPrice = ethers.utils.parseEther(formValue.step1.price.toString()).toString();

    return {
      name: formValue.step1.name,
      description: formValue.step1.description,
      price: parsedPrice,
      keywords: this.tags,
      payloadFile: formValue.step2.contentFile,
      thumbnails: [formValue.step2.nftImage]
    };
  }

  /*
  stepChanged(event: StepChangedArgs) {
    if (!this.isCreationStep(event.step.index)) {
      // Not in the upload phase so we exit here.
      return;
    }

    const newItemSpec = this.makeNewItemSpec();
    console.log(newItemSpec);

    this.newShopItemService.createItem(
      newItemSpec
    ).subscribe(progress => {
      console.log(progress);
    });
  }*/
}
