import { Inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { UploadService, UPLOAD_SERVICE_TOKEN } from '../blockchain';
import { buildShopUrl, filterNotNull } from '../shared';
import { NewShopData } from './new-shop/new-shop-data';


interface OpenSeaMetadata {
  name: string;
  description: string;

  // Arweave Link to a shop image
  image?: string;

  // Link to the generated shop
  external_link: string;

  // 100 indicates 1% seller fee
  seller_fee_basis_points: number;

  // Address to which the fee should be payed.
  fee_recipient: string;
}

@Injectable({
  providedIn: 'root'
})
export class OpenSeaMetadataDeployerService {

  constructor(
    @Inject(UPLOAD_SERVICE_TOKEN) private readonly uploadService: UploadService,
  ) { }

  deployMetadata(
    data: NewShopData,
    shopIdentifier: string,
    feeReceiver: string // later included in the NewShopData
  ): Observable<string> {
    // If we are in DEV only use a fake JSON
    // See: https://arweave.net/50v73rsAEbbXHnhHb_NZlvHMTjHaiRGB-UEo38tbZks
    if(!environment.production) {
      return of('ar://50v73rsAEbbXHnhHb_NZlvHMTjHaiRGB-UEo38tbZks');
    }

    const metadata = this.generateMetadata(
      data,
      shopIdentifier,
      feeReceiver
    );

    const dataSerialized = JSON.stringify(metadata);

    return this.uploadService.uploadJson(dataSerialized).pipe(
      map(progress => progress.fileId),
      filterNotNull(),
      tap(uri => console.log('Uploaded OpenSea metadata: ' + uri))
    );
  }

  private generateMetadata(
    data: NewShopData,
    shopIdentifier: string,
    feeReceiver: string // later included in the NewShopData
  ): OpenSeaMetadata {
    return {
      name: data.shopName,
      description: data.description,
      // image: '', // currently we have no image here
      external_link: buildShopUrl(shopIdentifier),
      seller_fee_basis_points: 0,
      fee_recipient: feeReceiver
    };
  }
}