import { Inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { UploadService, UPLOAD_SERVICE_TOKEN } from '../blockchain';
import { buildShopUrl, filterNotNull } from '../shared';
import { NewShopData } from './new-shop/new-shop-data';
import { ShopDeployStateService } from './new-shop/shop-deploy-state.service';


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
    private deploymentStateService: ShopDeployStateService
  ) { }

  getMetadataBytes(
    data: NewShopData,
    shopIdentifier: string,
    feeReceiver: string
  ): number {
    const metadata = this.generateMetadata(
      data,
      shopIdentifier,
      feeReceiver
    );

    return JSON.stringify(metadata).length;
  }

  deployMetadata(
    data: NewShopData,
    shopIdentifier: string,
    feeReceiver: string // later included in the NewShopData
  ): Observable<string> {
    // If we are in DEV only use a fake JSON and avoid a non working deployment.
    // See content: https://arweave.net/ffALMoCH0NvxjxnbCCCs47QlDRcvuRwaFjyPbfHUaVY
    if (environment.production === false) {
      return of('ar://ffALMoCH0NvxjxnbCCCs47QlDRcvuRwaFjyPbfHUaVY');
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
      // image: '', // We should probably generate a banner for shop deployments?.
      external_link: buildShopUrl(shopIdentifier),
      seller_fee_basis_points: data.royalityFeeBasepoints,
      fee_recipient: feeReceiver
    };
  }
}