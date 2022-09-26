import { Injectable } from "@angular/core";
import { URI, URL } from "src/app/shared";
import { ShopError } from "../shop-error";

@Injectable({
  providedIn: 'root'
})
export class UriResolverService {

  toURL(uri: URI): URL {
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      return uri;
    } else if (uri.startsWith('ar://')) {
      return uri.replace('ar://', 'https://arweave.net/');
    } else {
      throw new ShopError('Unknown URI format: ' + uri);
    }
  }

  private static ARWEAVE_GATEWAY = 'https://arweave.net/';
}