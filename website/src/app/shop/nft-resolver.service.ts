import { Injectable } from "@angular/core";
import { forkJoin, Observable } from "rxjs";

import { FileClientFactory, NetworkService } from "src/app/core";
import { BigNumber } from "ethers";
import { map, mergeMap, pluck, take } from "rxjs/operators";

import { Erc1155Metadata, URI } from "src/app/shared";

import { ShopItemsContractService } from "src/app/blockchain/shop-items-contract.service";
import { ShopServiceFactory } from "./shop-service-factory.service";

export interface NftMetadata {
  name: string;
  description: string;
  externalUri: URI;
  image: URI;
}

export interface NftToken {
  default: NftMetadata;
  payload: string;
  local: { [key: string]: NftMetadata; };
}

@Injectable({
  providedIn: 'root'
})
export class NftResolverService {

  constructor(
    private readonly shopItemContractService: ShopItemsContractService,
    private readonly fileClientFactory: FileClientFactory,
  ) {
  }

  resolve(tokenId: string): Observable<NftToken> {
    return this.shopItemContractService.getUri(BigNumber.from(tokenId)).pipe(
      mergeMap(uri => {
        const fileClient = this.fileClientFactory.getResolver(uri);
        return fileClient.get<Erc1155Metadata>(uri);
      }),
      map(x => this.buildNftToken(x))
    );
  }

  /**
   * Currently we dont support translations, as this is kind of hard to do
   * with Arweave as we seem not to be able to upload whole folders for the
   * NFT.
   */
  private buildNftToken(erc: Erc1155Metadata): NftToken {
    return {
      default: {
        name: erc.name,
        description: erc.description,
        externalUri: erc.external_uri,
        image: erc.image,
      },
      payload: erc.properties.contentUri,
      local: {}
    };
  }
}