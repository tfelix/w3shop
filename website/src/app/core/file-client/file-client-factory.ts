import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";
import { ShopError } from "../shop-error";
import { ArweaveMockClient } from "./arweave-mock-client";
import { ArweaveClient, FileClient } from "./file-client";

@Injectable({
  providedIn: 'root'
})
export class FileClientFactory {

  constructor(
    private readonly arweaveClient: ArweaveClient,
    private readonly mockClient: ArweaveMockClient
  ) {
  }

  getResolver(uri: string): FileClient {
    if (uri.startsWith('ar:')) {
      if(environment.injectMocks) {
        console.debug(`Resolver: ArweaveMockClient (${uri})`);
        return this.mockClient;
      } else {
        console.debug(`Resolver: ArweaveClient (${uri})`);
        return this.arweaveClient;
      }
    } else {
      throw new ShopError('Unknown file schema, no client found for: ' + uri);
    }
  }
}