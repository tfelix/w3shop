import { Observable, of, ReplaySubject } from "rxjs";
import { map, mergeMap, tap } from "rxjs/operators";
import { Progress, ShopConfig } from "src/app/shared";
import { ShopContractService } from "../blockchain/shop-contract.service";
import { ShopConfigUpdate } from "./shop.service";

import { ShopError, ScopedLocalStorage } from "src/app/core";
import { ProgressStage, UploadProgress, UploadService } from "src/app/blockchain";
import { Router } from "@angular/router";

interface SavedUploadedFile {
  fileId: string;
  uploadedConfig: ShopConfig
}

export class SmartContractConfigUpdateService {
  private static CONFIG_UPLOAD_KEY = 'SHOP_CONFIG_UPDATE';
  private static SHOP_CONFIG_UPDATE_PROGRESS: Progress<void> = {
    progress: 85,
    text: 'Execute update of the shop to the new configuration...',
    result: null
  };

  constructor(
    private readonly smartContractAddress: string,
    private readonly uploadService: UploadService,
    private readonly shopContractService: ShopContractService,
    private readonly localStorageService: ScopedLocalStorage,
    private readonly router: Router
  ) { }

  // FIXME the progress does not properly work.
  update(update: ShopConfigUpdate, existingConfig: ShopConfig, newMerkleRoot?: string): Observable<Progress<void>> {
    const sub = new ReplaySubject<Progress<void>>(1);

    const updatedConfig = { ...existingConfig, ...update };
    const existingUploadedConfig = this.getSavedUploadedConfig();

    let updateShopConfig$: Observable<string>;
    if (this.hasUploadedConfig(updatedConfig, existingUploadedConfig)) {
      // We found an existing uploaded file id that is equal to config. We can just re-use it.
      sub.next(SmartContractConfigUpdateService.SHOP_CONFIG_UPDATE_PROGRESS);
      updateShopConfig$ = of(existingUploadedConfig.fileId);
    } else {
      // Not yet uploaded/new so we can start the upload process to fetch the file id.
      updateShopConfig$ = this.uploadConfig(sub, updatedConfig);
    }

    // Update the shop contract with the new item root and config
    updateShopConfig$.pipe(
      tap(() => {
        sub.next(SmartContractConfigUpdateService.SHOP_CONFIG_UPDATE_PROGRESS);
      }),
      mergeMap((arweaveUri) => {
        return this.shopContractService.setConfig(this.smartContractAddress, arweaveUri)
      }),
      tap(() => {
        const progress: Progress<void> = {
          progress: 100,
          text: 'Shop successfully upated',
          result: null
        };
        sub.next(progress);
      }),
    ).subscribe(
      () => {
        // Clear the saved config again.
        this.localStorageService.removeItem(SmartContractConfigUpdateService.CONFIG_UPLOAD_KEY);
        // Goto admin dashboard
        // FIXME this does not properly work.
        this.router.navigate(['..']);
      },
      (err) => {
        throw new ShopError('Updating the shop config failed', err);
      }
    );

    return sub.asObservable();
  }

  private getSavedUploadedConfig(): SavedUploadedFile | null {
    const existingUploadedConfig = this.localStorageService.getItem(SmartContractConfigUpdateService.CONFIG_UPLOAD_KEY);

    if (!existingUploadedConfig) {
      return null;
    }

    return JSON.parse(existingUploadedConfig) as SavedUploadedFile;
  }

  private hasUploadedConfig(newConfig: ShopConfig, uploadedConfig: SavedUploadedFile | null): boolean {
    if (!uploadedConfig) {
      return false;
    }
    return JSON.stringify(newConfig) === JSON.stringify(uploadedConfig.uploadedConfig);
  }

  private uploadConfig(sub: ReplaySubject<Progress<void>>, config: ShopConfig): Observable<string> {
    const configData = JSON.stringify(config);

    return this.uploadService.uploadJson(configData).pipe(
      tap(up => {
        // This is normed to 85%, to have some room left for the contract update.
        up.progress = Math.ceil(up.progress / 100.0 * 80);
        const progress = this.toProgress(up);
        sub.next(progress);
      }),
      map(up => {
        if (up.fileId) {
          return 'ar://' + up.fileId;
        } else {
          throw new ShopError('Upload of the configuration file has failed.');
        }
      })
    );
  }

  // TODO This can be unified with the shop creation if the progress component
  //   is used there too.
  private toProgress(p: UploadProgress): Progress<void> {
    let text = '';
    switch (p.stage) {
      case ProgressStage.SIGN_IN:
        text = 'Please sign into the Bundlr network to start the upload';
        break;
      case ProgressStage.FUND:
        text = 'Bundlr must be funded in order to continue with the upload';
        break;
      case ProgressStage.UPLOAD:
        text = 'Uploading files...';
        break;
      case ProgressStage.COMPLETE:
        text = 'File upload complete';
        break;
      default:
        text = 'Unknown';
        break;
    }

    return {
      progress: p.progress,
      text: text,
      result: null
    }
  }
}
