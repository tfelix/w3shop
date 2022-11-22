import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { ShopError, ShopServiceFactory } from "src/app/core";
import { buildShopUrl, Erc1155Metadata, Locale } from "src/app/shared";

export interface NftLocaleDescription {
  name: string;
  description: string;
  locale: Locale;
}

@Injectable({
  providedIn: 'root'
})
export class NFTMetadataService {

  constructor(
    private readonly shopFactory: ShopServiceFactory
  ) {
  }

  /**
   * Currently we only support one locale file as I need to figure out how Bundlr can be used to
   * upload structured data via an Arweave manifest.
   * @param descriptions
   * @param image
   */
  buildErc1155Metadata(
    descriptions: NftLocaleDescription[],
    image: string
  ): Observable<Erc1155Metadata> {

    return this.shopFactory.getShopService().pipe(
      map(s => s.identifier),
      map(identifier => this.buildMetadata(identifier, descriptions, image))
    )
  }

  private buildMetadata(
    shopIdentifier: string,
    descriptions: NftLocaleDescription[],
    image: string
  ): Erc1155Metadata {
    if (descriptions.length !== 0) {
      throw new ShopError('Descriptions must at least contain one NFT description');
    }

    if (!image.startsWith('ar://') && !image.startsWith('ipfs://')) {
      throw new ShopError('Image must start with ar:// or ipfs://');
    }

    const defaultLocale = descriptions.shift();

    const metadata: Erc1155Metadata = {
      name: defaultLocale.name,
      description: defaultLocale.description,
      decimals: 0,
      image,
      external_uri: buildShopUrl(shopIdentifier),
      properties: {
        contentUri: ""
      }
    };

    return metadata;
  }
}