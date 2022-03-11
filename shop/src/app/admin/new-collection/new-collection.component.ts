import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';

interface EncryptedFile {
  encryptedZip: Blob;
  symmetricKey: Uint8Array[32];
}

@Component({
  selector: 'w3s-new-collection',
  templateUrl: './new-collection.component.html',
  styleUrls: ['./new-collection.component.scss']
})
export class NewCollectionComponent {

  settingsForm = this.fb.group({
    shopName: [''],
    shortDescription: [''],
    description: [''],
  });

  tags: string[] = [];

  constructor(
    private readonly fb: FormBuilder,
  ) { }

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

  }
}
