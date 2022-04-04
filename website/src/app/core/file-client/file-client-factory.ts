import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";
import { ShopError } from "../shop-error";
import { ArweaveMockClient } from "./arweave-mock-client";
import { ArweaveClient, FileClient } from "./arweave-file-client";
import { FileHttpClient } from "./file-http-client";

@Injectable({
  providedIn: 'root'
})
export class FileClientFactory {

  constructor(
    private readonly arweaveClient: ArweaveClient,
    private readonly mockClient: ArweaveMockClient,
    private readonly httpClient: FileHttpClient
  ) {
  }

  getResolver(uri: string): FileClient {
    if (uri.startsWith('ar:')) {
      if (environment.injectMocks) {
        console.debug(`Resolver: ArweaveMockClient (${uri})`);
        return this.mockClient;
      } else {
        console.debug(`Resolver: ArweaveClient (${uri})`);
        return this.arweaveClient;
      }
    } else if (uri.startsWith('http:') || uri.startsWith('https')) {
      return this.httpClient;
    } else {
      throw new ShopError('Unknown file schema, no client found for: ' + uri);
    }
  }
}