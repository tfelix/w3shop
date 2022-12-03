import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";

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
    if (!environment.production) {
      console.info(`Resolver: ArweaveMockClient (${uri})`);
      return this.mockClient;
    } else {
      console.info(`Resolver: ArweaveClient (${uri})`);
      return this.fileHttpClient;
    }
  }
}