import { Injectable } from "@angular/core";
import { ShopError } from "../shop-error";
import { ArweaveClient, FileClient } from "./file-client";

@Injectable({
  providedIn: 'root'
})
export class FileClientFactory {

  constructor(
    private readonly arweaveClient: ArweaveClient
  ) {
  }

  getResolver(uri: string): FileClient {
    if (uri.startsWith('ar:')) {
      return this.arweaveClient;
    } else {
      throw new ShopError('Unknown file schema, no client found for: ' + uri);
    }
  }
}