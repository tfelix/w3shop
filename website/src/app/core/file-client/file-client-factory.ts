import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";

import { ShopError } from "../shop-error";
import { ArweaveMockClient } from "./arweave-mock-client";
import { FileClient } from "./file-client";
import { FileHttpClient } from "./file-http-client";

@Injectable({
  providedIn: 'root'
})
export class FileClientFactory {

  constructor(
    private readonly mockClient: ArweaveMockClient,
    private readonly fileHttpClient: FileHttpClient
  ) {
  }

  getResolver(uri: string): FileClient {
    // FIXME special case because of broken contract. Fixme as soon as this was fixed and has automatic http://arweave prefix.
    if (uri.startsWith('ar://') || uri.startsWith('AAAAAAA')) {
      if (!environment.production) {
        console.debug(`Resolver: ArweaveMockClient (${uri})`);
        return this.mockClient;
      } else {
        console.debug(`Resolver: ArweaveClient (${uri})`);
        return this.fileHttpClient;
      }
    } else if (uri.startsWith('http://') || uri.startsWith('https://')) {
      return this.fileHttpClient;
    } else {
      throw new ShopError(`Unknown file schema, no client found for URI: '${uri}'`);
    }
  }
}