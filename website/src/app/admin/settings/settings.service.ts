import { Inject, Injectable } from "@angular/core";
import { Observable, forkJoin } from "rxjs";
import { map, mergeMap, pluck, share } from "rxjs/operators";
import { ShopContractService } from "src/app/blockchain";
import { filterNotNull } from "src/app/shared";
import { ShopConfigUpdate, ShopServiceFactory } from "src/app/shop";
import { UPLOAD_SERVICE_TOKEN, UploadService } from "src/app/updload";

@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  constructor(
    private readonly shopFactory: ShopServiceFactory,
    private readonly shopContractService: ShopContractService,
    @Inject(UPLOAD_SERVICE_TOKEN) private readonly uploadService: UploadService,
  ) {
  }

  updateShopSettings(update: ShopConfigUpdate): Observable<void> {
    const shop$ = this.shopFactory.getShopService().pipe(share());
    const shopAddress$ = shop$.pipe(map(s => s.smartContractAddress));
    const uploadedShopDataUri$ = shop$.pipe(
      map(shop => ({ ...shop.getConfig(), ...update })),
      mergeMap(updatedConfig => this.uploadJson(JSON.stringify(updatedConfig)))
    );

    return forkJoin([shopAddress$, uploadedShopDataUri$]).pipe(
      mergeMap(([shopAddress, uploadedShopDataUri]) => {
        return this.shopContractService.setConfig(shopAddress, uploadedShopDataUri)
      })
    );
  }

  private uploadJson(data: string): Observable<string> {
    return this.uploadService.uploadJson(data).pipe(
      pluck('fileId'),
      filterNotNull(),
    ) as Observable<string>;
  }
}