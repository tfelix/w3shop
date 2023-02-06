import { forkJoin, Observable } from 'rxjs';
import { map, mergeMap, pluck, share, shareReplay, take, tap } from 'rxjs/operators';
import { Inject, Injectable } from '@angular/core';

import { buildShopItemUrl, DeployStepService, Erc1155Metadata, filterNotNull, ItemV1, StepData, StepState } from 'src/app/shared';

import { ShopError } from 'src/app/core';
import { ShopServiceFactory } from 'src/app/shop';
import { UploadService, UPLOAD_SERVICE_TOKEN } from 'src/app/updload';
import { EncryptedFileMeta, ENCRYPTION_SERVICE_TOKEN, FileCryptorService } from 'src/app/encryption';

export interface NewShopItemSpec {
  name: string;
  description: string;
  price: string;
  keywords: string[],
  payloadFile: File;
  thumbnails: File[];
}

interface NewShopItemData {
  spec: NewShopItemSpec,
  shopItemMetaUri?: string;
  thumbnailUris?: string[];
  shopMetaUri?: string;
  tokenId?: string;
  encryptedPayloadMeta?: EncryptedFileMeta;
  payloadFileUri?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AddShopItemService {

  private shopItemData: NewShopItemData | null = null;

  constructor(
    private readonly shopFactory: ShopServiceFactory,
    @Inject(ENCRYPTION_SERVICE_TOKEN) private readonly fileCryptor: FileCryptorService,
    @Inject(UPLOAD_SERVICE_TOKEN) private readonly uploadService: UploadService,
  ) {
  }

  /**
   * TODO In order to save gas, this process should be batchable for possible multiple items. Try
   *   to require as little signature as possible from the user.
   * @returns
   */
  createItem(
    newItemSpec: NewShopItemSpec,
    deployStepService: DeployStepService
  ) {
    this.shopItemData = {
      spec: newItemSpec
    };

    this.verifyFileSizeLimit(newItemSpec.payloadFile);

    newItemSpec.thumbnails.forEach(thumbnailFile => {
      this.verifyFileSizeLimit(thumbnailFile);
    });

    deployStepService.executeStep$.subscribe(n => this.executeStep(n, deployStepService, newItemSpec));

    this.makeDeploySteps(deployStepService, newItemSpec);
  }


  makeDeploySteps(
    deployStepService: DeployStepService,
    newItemSpec: NewShopItemSpec
  ) {
    const uploadImageSteps = newItemSpec.thumbnails.map((thumbnail, i) => {
      return {
        title: 'Upload Thumbnail #' + (i + 1),
        buttonText: 'Upload',
        text: 'You are now able to upload one of the thumbnail file(s).',
        data: {
          thumbnailIdx: i,
          file: thumbnail
        }
      };
    });

    deployStepService.setSteps([
      {
        title: 'Check Bundlr Funds',
        buttonText: 'Check Funds',
        text: 'You are about to upload the shop item data as well as the thumbnails, so we must check if Bundlr is funded.',
        errorText: 'Checking the funds failed. You can retry this step without problems.'
      },
      {
        title: 'Fund Bundlr',
        buttonText: 'Fund Bundlr',
        text: 'In it was detected that your Bundlr funds are not enough. You need to charge it with a small amount of Ether to upload the required files.',
        errorText: 'Funding Bundlr failed. Maybe your balance is updated after some time. The following error was reported for debugging purposes:'
      },
      ...uploadImageSteps,
      {
        title: 'Encrypt Item File',
        buttonText: 'Encrypt',
        text: 'Protect your item file, so only legitimate buyers can decrypt it.',
      },
      {
        title: 'Upload Item File',
        buttonText: 'Upload',
        text: 'Upload the file so your customer can download it.',
      },
      {
        title: 'Upload Item NFT Metadata',
        buttonText: 'Upload',
        text: 'This file contains the basic information about your sold item for NFT marketplaces.',
      },
      {
        title: 'Upload Item Shop Metadata',
        buttonText: 'Upload',
        text: 'This file contains the basic information about your sold item for this shop.',
      },
      {
        title: 'Create New Item',
        buttonText: 'Create Item',
        text: 'The newly updated item metadata must be used to register a new item for the shop.',
      },
      {
        title: 'Upload Shop Data',
        buttonText: 'Upload',
        text: 'Adds the item to the shops inventory and uploads the shop description file.',
      },
      {
        title: 'Update Shop Contract',
        buttonText: 'Update',
        text: 'Update the shops contract with the new data so your customers can actually buy your added item.',
      }
    ]);
  }

  private executeStep(
    data: StepData,
    stepService: DeployStepService,
    itemSpec: NewShopItemSpec
  ) {
    // n is dynamic because of the dynamic number of thumbnail upload steps. We need
    // to normalize this n here and extract the thumbnail number out of it.
    const numThumbnails = itemSpec.thumbnails.length;
    const stepCountBeforeThumbnailUpload = 2;
    const n = data.idx;

    if (n < stepCountBeforeThumbnailUpload) {
      // Pre-Upload Checks
      switch (n) {
        // Check Bundlr Fund
        case 0:
          stepService.setStepExecution(n, this.hasEnoughBundlrFunds())
            .subscribe((hasEnoughBundlrFunds) => {
              stepService.setStepState(0, StepState.SUCCESS);

              if (hasEnoughBundlrFunds) {
                stepService.setStepState(n + 1, StepState.SKIPPED);
                stepService.setStepState(n + 2, StepState.PENDING);
              } else {
                stepService.setStepState(1, StepState.PENDING);
              }

              this.logState();
            },
              (err: ShopError) => stepService.setStepErrorMessage(n, err.message)
            );
          break;
        // Fund Bundlr
        case 1:
          // We fund for the guessed upload size + 10%.
          stepService.setStepExecution(n, this.uploadService.fund(5 * 1024 ** 2))
            .subscribe(
              () => {
                stepService.setStepState(n, StepState.SUCCESS);
                stepService.setStepState(n + 1, StepState.PENDING);

                this.logState();
              },
              (err: ShopError) => stepService.setStepErrorMessage(n, err.message)
            );
          break;
      }
    } else if (n < 2 + numThumbnails) {
      // Thumbnail uploads
      const currentThumbnailIdx = data.data?.thumbnailIdx as number;
      console.debug('Uploading thumbnail: ' + currentThumbnailIdx);

      stepService.setStepExecution(n, this.uploadThumbnails(itemSpec, currentThumbnailIdx))
        .subscribe(
          (thumbnailUri) => {
            stepService.setStepState(n, StepState.SUCCESS);
            stepService.setStepState(n + 1, StepState.PENDING);

            if (!this.shopItemData.thumbnailUris) {
              this.shopItemData.thumbnailUris = [];
            }

            this.shopItemData.thumbnailUris.push(thumbnailUri);
            this.logState();
          },
          (err: ShopError) => stepService.setStepErrorMessage(n, err.message)
        );
    } else {
      // Item NFT Metadata Upload and Shop Upload/Update
      const correctedN = n - 2 - numThumbnails;
      switch (correctedN) {
        // Encrypt payload
        case 0:
          stepService.setStepExecution(n, this.encryptPayload())
            .subscribe((result) => {
              stepService.setStepState(n, StepState.SUCCESS);
              stepService.setStepState(n + 1, StepState.PENDING);

              this.shopItemData.tokenId = result.itemTokenId;
              this.shopItemData.encryptedPayloadMeta = result.meta;

              this.logState();
            },
              (err: ShopError) => stepService.setStepErrorMessage(n, err.message));
          break;

        // Upload payload
        case 1:
          stepService.setStepExecution(n, this.uploadPayloadFile())
            .subscribe((payloadFileUri) => {
              stepService.setStepState(n, StepState.SUCCESS);
              stepService.setStepState(n + 1, StepState.PENDING);

              this.shopItemData.payloadFileUri = payloadFileUri;

              this.logState();
            },
              (err: ShopError) => stepService.setStepErrorMessage(n, err.message));
          break;

        // Upload NFT Metadata
        case 2:
          stepService.setStepExecution(n, this.uploadNftMetadata())
            .subscribe(
              () => {
                stepService.setStepState(n, StepState.SUCCESS);
                stepService.setStepState(n + 1, StepState.PENDING);

                this.logState();
              },
              (err: ShopError) => stepService.setStepErrorMessage(n, err.message)
            );
          break;

        // Upload Item Metadata
        case 3:
          stepService.setStepExecution(n, this.uploadItemMetadataFile())
            .subscribe(
              (shopItemMetaUri) => {
                stepService.setStepState(n, StepState.SUCCESS);
                stepService.setStepState(n + 1, StepState.PENDING);

                this.shopItemData.shopItemMetaUri = shopItemMetaUri;

                this.logState();
              },
              (err: ShopError) => stepService.setStepErrorMessage(n, err.message)
            );
          break;

        case 4:
          // Create New Item
          stepService.setStepExecution(n, this.registerItem())
            .subscribe(
              () => {
                stepService.setStepState(n, StepState.SUCCESS);
                stepService.setStepState(n + 1, StepState.PENDING);

                this.logState();
              },
              (err: ShopError) => stepService.setStepErrorMessage(n, err.message)
            );
          break;

        // Upload Shop Data
        case 5:
          stepService.setStepExecution(n, this.updateShop())
            .subscribe(
              () => {
                stepService.setStepState(n, StepState.SUCCESS);
                stepService.setStepState(n + 1, StepState.PENDING);

                this.logState();
              },
              (err: ShopError) => stepService.setStepErrorMessage(n, err.message)
            );
          break;
      }
    }
  }

  private logState() {
    console.log('Current state: ', this.shopItemData);
  }

  private verifyFileSizeLimit(file: File) {
    // Currently limited to 500 MB
    const currentFileLimitBytes = 500 * 1024 * 1024;
    if (file.size > currentFileLimitBytes) {
      throw new ShopError('Currently you can not upload files bigger than 500 MB');
    }
  }

  private hasEnoughBundlrFunds(): Observable<boolean> {
    /**
     * The strategy is that we require at least 2.5MB of uploadable data but request 5 if its less to be safe
     * against price swings in between and don't request new funds from the user.
     */
    return this.uploadService.getUploadableBytesCount().pipe(
      map((uploadableBundlrBytes) => {
        console.debug('uploadableBundlrBytes: ' + uploadableBundlrBytes);

        const estimatedFileSizeMb = 10;
        return uploadableBundlrBytes >= estimatedFileSizeMb * (1024 ** 2);
      })
    );
  }

  private encryptPayload(): Observable<{ itemTokenId: string, meta: EncryptedFileMeta }> {
    const itemSpec = this.shopItemData.spec;

    const shopAddress$ = this.shopFactory.getShopService().pipe(
      map(s => s.smartContractAddress),
      shareReplay(1)
    );

    // Encrypt payload with access condition and lit
    return forkJoin([shopAddress$, this.findNextTokenId()]).pipe(
      mergeMap(([shopContractAddress, nextTokenIds]) => this.fileCryptor.encryptPayloadFile(
        itemSpec.payloadFile,
        shopContractAddress,
        nextTokenIds[0]
      ).pipe(
        map(meta => ({ itemTokenId: nextTokenIds[0], meta }))
      )));
  }

  private uploadPayloadFile(): Observable<string> {
    const meta = this.shopItemData.encryptedPayloadMeta;

    return this.uploadFile(meta.encryptedFile).pipe(
      tap(x => console.log('uploadPayloadFile', x)),
      shareReplay(1)
    );
  }

  private uploadNftMetadata(): Observable<string> {
    const shop$ = this.shopFactory.getShopService().pipe(take(1));
    return shop$.pipe(
      map(x => x.identifier),
      map((shopIdentifier) => this.makeNftMetadata(shopIdentifier)),
      mergeMap(nftMetadata => this.uploadJson(JSON.stringify(nftMetadata))),
      shareReplay(1)
    );
  }

  private uploadItemMetadataFile(): Observable<string> {
    const itemData = this.makeItemData();

    return this.uploadJson(JSON.stringify(itemData))
      .pipe(
        shareReplay(1),
        tap(x => console.log('uploadItemMetadataFile', x)),
      );
  }

  private registerItem(): Observable<void> {
    if (!this.shopItemData.shopItemMetaUri) {
      throw new ShopError('Item Meta URI is undefined');
    }

    const shop$ = this.shopFactory.getShopService().pipe(take(1));

    return shop$.pipe(
      mergeMap((shop) => shop.addItemUri(this.shopItemData.shopItemMetaUri)),
      shareReplay(1)
    );
  }

  private updateShop(): Observable<void> {
    if (!this.shopItemData.shopItemMetaUri) {
      throw new ShopError('Item Meta URI is undefined');
    }

    const shop$ = this.shopFactory.getShopService().pipe(take(1));

    return forkJoin([
      shop$,
    ]).pipe(
      mergeMap(([shop]) => {
        // later this must be batchable for up to 5 items
        shop.getItemService().addItem(
          this.shopItemData.tokenId,
          this.shopItemData.shopItemMetaUri
        );

        // TODO This is currently updloading the shop config file as well as updating the contract.
        // Split this in order to better control the upload process. Refactor shop service?
        return shop.updateItemsConfigAndRoot();
      })
    );
  }

  private makeItemData(): ItemV1 {
    const spec = this.shopItemData.spec;
    const thumbnailUris = this.shopItemData.thumbnailUris;

    if (!thumbnailUris) {
      throw new ShopError('Thumbnail URIs are not present');
    }

    return {
      version: '1',
      name: spec.name,
      description: spec.description,
      // For now its just the normal description. Later make this independent from each other
      detailedDescription: spec.description,
      price: spec.price,
      mime: spec.payloadFile.type,
      filename: spec.payloadFile.name,
      isSold: true,
      thumbnails: thumbnailUris
    };
  }

  private makeNftMetadata(
    shopIdentifier: string,
  ): Erc1155Metadata {
    const nftThumbnailUri = this.shopItemData.thumbnailUris[0];

    return {
      name: this.shopItemData.spec.name,
      description: this.shopItemData.spec.description,
      decimals: 0,
      external_uri: buildShopItemUrl(shopIdentifier, this.shopItemData.tokenId),
      image: nftThumbnailUri,
      attributes: [{ value: 'Digital Item' }],
      properties: {
        version: 1,
        content_uri: this.shopItemData.payloadFileUri,
        access_condition: this.shopItemData.encryptedPayloadMeta.accessConditionBase64,
        encrypted_key: this.shopItemData.encryptedPayloadMeta.encryptedKeyBase64
      }
    };
  }

  private uploadJson(data: string): Observable<string> {
    return this.uploadService.uploadJson(data).pipe(
      pluck('fileId'),
      filterNotNull(),
    ) as Observable<string>;
  }

  private uploadFile(blob: Blob): Observable<string> {
    return this.uploadService.uploadBlob(blob).pipe(
      pluck('fileId'),
      filterNotNull(),
      share()
    ) as Observable<string>;
  }

  private uploadThumbnails(
    itemSpec: NewShopItemSpec,
    n: number
  ): Observable<string> {
    if (n < 0 || n > itemSpec.thumbnails.length) {
      throw new ShopError(`Can not upload thumbnail ${n}, there are only ${itemSpec.thumbnails.length} thumbnails given.`);
    }

    const thumbnail = itemSpec.thumbnails[n];
    console.log('Uploading thumbnail: ', itemSpec.thumbnails);

    return this.uploadFile(thumbnail).pipe(
      shareReplay(1)
    );
  }

  private findNextTokenId(): Observable<string[]> {
    return this.shopFactory.getShopService().pipe(
      // Later also support up to 5 new items as a batch creation.
      mergeMap(shop => shop.getNextItemIds()),
      shareReplay(1)
    );
  }
}