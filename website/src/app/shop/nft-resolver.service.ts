import { Injectable } from "@angular/core";
import { forkJoin, Observable } from "rxjs";

import { Erc1155Metadata, NftToken } from "src/app/shared";
import { FileClientFactory, ShopContractService, ShopServiceFactory } from "src/app/core";
import { BigNumber } from "ethers";
import { map, mergeMap, pluck, shareReplay } from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class NftResolverService {

  constructor(
    private readonly shopContractService: ShopContractService,
    private readonly shopServiceFactory: ShopServiceFactory,
    private readonly fileClientFactory: FileClientFactory
  ) {
  }

  resolve(tokenId: string): Observable<NftToken> {
    const shop$ = this.shopServiceFactory.shopService$;

    const metadataUri$ = shop$.pipe(
      pluck('smartContractAddress'),
      mergeMap(contractAddr => this.shopContractService.getUri(contractAddr, BigNumber.from(tokenId)))
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
        image: erc.image
      },
      local: {}
    };
  }
}