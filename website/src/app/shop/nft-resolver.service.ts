import { Injectable } from "@angular/core";
import { forkJoin, Observable } from "rxjs";

import { FileClientFactory } from "src/app/core";
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
    private readonly shopServiceFactory: ShopServiceFactory,
    private readonly fileClientFactory: FileClientFactory
  ) {
  }

  resolve(tokenId: string): Observable<NftToken> {
    const shop$ = this.shopServiceFactory.shopService$;

    const metadataUri$ = shop$.pipe(
      take(1),
      pluck('smartContractAddress'),
      mergeMap(contractAddr => this.shopItemContractService.getUri(contractAddr, BigNumber.from(tokenId)))
    );

    const fileClient$ = metadataUri$.pipe(
      map(uri => this.fileClientFactory.getResolver(uri)),
    )

    return forkJoin([metadataUri$, fileClient$]).pipe(
      mergeMap(([uri, fileClient]) => fileClient.get<Erc1155Metadata>(uri)),
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
      payload: erc.properties.payload,
      local: {}
    };
  }
}