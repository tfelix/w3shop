import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';

interface EncryptedFile {
  encryptedZip: Blob;
  symmetricKey: Uint8Array[32];
}

@Component({
  templateUrl: './new-item.component.html',
})
export class NewItemComponent {

  // https://blog.angular-university.io/angular-file-upload/

  newItemForm = this.fb.group({
    name: [''],
    nftImage: [''],
    file: [''],
    description: [''],
    defaultLanguage: [''],
    localization: this.fb.group({
      languageCode: [''],
      name: [''],
      description: [''],
    })
  });

  tags: string[] = [];

  thumbnailImgData: ArrayBuffer | null = null;

  get f() {
    return this.newItemForm.controls;
  }

  constructor(
    private readonly fb: FormBuilder,
  ) { }

  onFileImageChange(files: FileList) {
    if (files.length === 0)
      return;

    var mimeType = files[0].type;
    if (mimeType.match(/image\/*/) == null) {
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(files[0]);
    reader.onload = (_event) => {
      this.thumbnailImgData = reader.result as ArrayBuffer;
    }
  }

  onFileDrop(event: DragEvent) {
    console.log('File(s) dropped');

    // Prevent default behavior (Prevent file from being opened)
    event.preventDefault();

    if (event.dataTransfer.items.length != 1) {
      return;
    }

    const item = event.dataTransfer.items[0];

    if (item.kind !== 'file') {
      return;
    }

    const file = event.dataTransfer.items[0].getAsFile();

    /*
    from(LitJsSdk.zipAndEncryptFiles(file)).subscribe((x: EncryptedFile) => {
      // any kind of extension (.txt,.cpp,.cs,.bat)
      var filename = "tfelix-shop-c10-i1-hello.txt.zip";

      saveAs(x.encryptedZip, filename);

      const fileHandle = await window.showSaveFilePicker();
      const fileStream = await fileHandle.createWritable();
      await fileStream.write(new Blob(["CONTENT"], { type: "text/plain" }));
      await fileStream.close();
    });*/
  }

  dragOverHandler(event) {
    event.preventDefault();
  }

  onSubmit() {
    // Save the data in case something goes wrong
    // Encrypt the file via Lit
    // Generate NFT metadata
    // Give the user the option to download the enc. file and nft metadata
    // Ask the user to upload this via the Arweave network or Crust
    // Confirm the upload and enter the Arweave URLs of the data.

    // Will be available at https://arweave.net/<TX_ID>/<ID>

    // Regenerate merkle root
    // Update Ceramic file
    // Update merkle root in SC
  }
}
