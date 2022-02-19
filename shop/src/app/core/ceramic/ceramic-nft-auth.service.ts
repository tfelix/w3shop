import { Injectable } from "@angular/core";
import CeramicClient from "@ceramicnetwork/http-client";
import { createNftDidUrl } from "nft-did-resolver";
import { Observable, throwError } from "rxjs";
import { CeramicAuthenticator } from "./ceramic-authenticator";

const ChainIds = {
  mainnet: 'eip155:1',
  rinkeby: 'eip155:4',
  arbitrum: 'eip155:42161',
  arbitrum_rinkeby: 'eip155:421611'
};

function generateOwnerNftDid(contractId: string) {
  // "did:nft:eip155:4_erc721:0xe2a6a2da2408e1c944c045162852ef2056e235ab_1"
  return createNftDidUrl({
    chainId: 'eip155:1',
    namespace: 'erc1155',
    contract: contractId,
    tokenId: '0',
  });
}

/**
 * Since we will work on Arbitrum, we need to setup a proper graph indexer here and configure this.
 * See: https://www.npmjs.com/package/nft-did-resolver
 */
/*
const config: NftResolverConfig = {
  ceramic,
  chains: {
    'eip155:1': {
      blocks: 'https://api.thegraph.com/subgraphs/name/yyong1010/ethereumblocks',
      skew: 15000,
      assets: {
        erc721: 'https://api.thegraph.com/subgraphs/name/sunguru98/mainnet-erc721-subgraph',
        erc1155: 'https://api.thegraph.com/subgraphs/name/sunguru98/mainnet-erc1155-subgraph',
      },
    },
    'eip155:4': {
      blocks: 'https://api.thegraph.com/subgraphs/name/mul53/rinkeby-blocks',
      skew: 15000,
      assets: {
        erc721: 'https://api.thegraph.com/subgraphs/name/sunguru98/erc721-rinkeby-subgraph',
        erc1155: 'https://api.thegraph.com/subgraphs/name/sunguru98/erc1155-rinkeby-subgraph',
      },
    },
  },
}
const nftResolver = NftResolver.getResolver(config)
const didResolver = Resolver(nftResolver)
*/

@Injectable({
  providedIn: 'root'
})
export class CeramicNftAuthService implements CeramicAuthenticator {

  authenticate(ceramic: CeramicClient): Observable<string> {
    return throwError('Not implemeneted');
  }
}