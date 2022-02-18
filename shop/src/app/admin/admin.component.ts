import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { BootstrapService } from 'src/app/core';
import { ShopConfigV1 } from 'src/app/shared';

interface EncryptedFile {
  encryptedZip: Blob;
  symmetricKey: Uint8Array[32];
}

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
})
export class AdminComponent {

  settingsForm = this.fb.group({
    shopName: [''],
    shortDescription: [''],
    description: [''],
  });

  keywords: string[] = [];

  private readonly configV1$: Observable<ShopConfigV1>;

  constructor(
    private readonly fb: FormBuilder,
    private readonly bootstrapService: BootstrapService
  ) {
    this.configV1$ = this.bootstrapService.configV1$;

    this.configV1$.subscribe(c => {
      this.settingsForm.patchValue(c);
      this.keywords = c.keywords;
    });
  }

  onSubmit() {
    // Build the new config and save it to ceramic.
    this.configV1$.pipe(
      map(c => ({ ...c, ...this.settingsForm.value })),
      map(c => ({ ...c, keywords: this.keywords })),
      tap(c => console.log(c))
      // TODO send to ceramic
    ).subscribe();
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
}
