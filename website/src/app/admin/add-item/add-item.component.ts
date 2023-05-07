import { Component, OnDestroy, ViewEncapsulation } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { faFile, faFileImport, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { ethers } from 'ethers';
import { DeployStepService } from 'src/app/shared';
import { AddShopItemService, NewShopItemSpec } from './add-shop-item.service';
import { Subscription } from 'rxjs';

interface FileInfo {
  fileSizeBytes: number;
  lastModified: Date;
  type: string;
  fileName: string;
}

interface ImageView {
  fileSizeBytes: number;
  fileName: string;
  imgSrc: SafeResourceUrl;
}

@Component({
  templateUrl: './add-item.component.html',
  styleUrls: ['./add-item.component.scss'],
  // For the Drag&Drop we need to style child elements and thus need the view encapsulation to be none.
  // See https://stackoverflow.com/questions/36527605/how-to-style-child-components-from-parent-components-css-file
  encapsulation: ViewEncapsulation.None,
  providers: [DeployStepService]
})
export class AddItemComponent implements OnDestroy {

  faFileIcon = faFile;
  faFileImport = faFileImport;
  faHelp = faInfoCircle;

  thumbnailImgs: ImageView[] = [];

  nftCoverImg: ImageView[] = [];
  nftCoverImgData: ArrayBuffer | null = null;

  isDeploying = false;
  isSuccess = false;

  private _progress: number;
  private stepCount: number;
  private stepSub: Subscription;
  private executeStepSub: Subscription;
  private itemAddedSub: Subscription;

  get progress() {
    return this._progress;
  }

  get progressPercent() {
    return this._progress + '%';
  }

  private set progress(value: number) {
    this._progress = value;
  }


  newItemForm = new FormGroup({
    name: new FormControl('', Validators.required),
    shortDescription: new FormControl('', [Validators.required, Validators.maxLength(200)]),
    description: new FormControl('', Validators.required),
    price: new FormControl('', Validators.required),
    contentFile: new FormControl<File>(null, Validators.required),
    thumbnailFiles: new FormArray<FormControl<File>>([], [Validators.required, Validators.minLength(1), Validators.maxLength(10)])
  });

  get thumbnailFiles(): FormArray {
    return this.newItemForm.get('thumbnailFiles') as FormArray;
  }

  tags: string[] = [];
  fileInfo: FileInfo | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private sanitizer: DomSanitizer,
    private readonly addShopItemService: AddShopItemService,
    private readonly deployStepService: DeployStepService
  ) {
    this.stepSub = this.deployStepService.steps$.subscribe(steps => {
      this.stepCount = steps.length;
    });
    this.executeStepSub = this.deployStepService.executeStep$.subscribe(step => {
      this.progress = (step.idx + 1) * 100 / this.stepCount;
    });
    this.itemAddedSub = this.addShopItemService.itemAdded$.subscribe(() => {
      this.isSuccess = true;
    });
  }

  ngOnDestroy(): void {
    this.stepSub.unsubscribe();
    this.executeStepSub.unsubscribe();
    this.itemAddedSub.unsubscribe();
  }

  onPayloadFileChange(files: FileList) {
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

    this.newItemForm.patchValue({ contentFile: file });
  }

  onThumbnailFileChange(files: FileList) {
    if (files.length === 0) {
      this.fileInfo = null;
      return;
    }

    // The sortable library does not update if we push directly into the
    // variable so we need a helper one.
    const newThumbnails = [...this.thumbnailImgs];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      const blobUrl = URL.createObjectURL(file);
      const safeblobUrl = this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl);

      newThumbnails.push({
        fileName: file.name,
        fileSizeBytes: file.size,
        imgSrc: safeblobUrl
      });

      this.thumbnailFiles.push(this.fb.control(file));
    }

    this.thumbnailImgs = newThumbnails;
  }

  removeThumbnail(index: number) {
    this.thumbnailImgs = this.thumbnailImgs.slice(index);
  }

  private makeNewItemSpec(): NewShopItemSpec {
    const formValue = this.newItemForm.value;

    // Fix the entered price info into the right format without decimal
    const parsedPrice = ethers.utils.parseEther(formValue.price.toString()).toString();

    return {
      name: formValue.name,
      description: formValue.description,
      price: parsedPrice,
      keywords: this.tags,
      payloadFile: formValue.contentFile,
      thumbnails: formValue.thumbnailFiles
    };
  }

  createNewItem() {
    this.isDeploying = true;
    const itemSpec = this.makeNewItemSpec();

    this.addShopItemService.createItem(itemSpec, this.deployStepService);
  }
}
