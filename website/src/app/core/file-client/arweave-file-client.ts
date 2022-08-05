import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { URI, URL } from "src/app/shared";
import { ShopError } from "../shop-error";
import { BaseHttpClient } from "./base-http-client";


@Injectable({
  providedIn: 'root'
})
export class ArweaveClient extends BaseHttpClient {
  constructor(
    httpClient: HttpClient
  ) {
    super(httpClient);
  }

  toURL(uri: URI): URL {
    return this.uriToUrl(uri);
  }

  private uriToUrl(uri: string): string {
    if (!uri.startsWith('ar://')) {
      throw new ShopError('Requested uri did not start with \'ar://\' prefix: ' + uri);
    }

    const id = uri.slice(3);

    return `https://arweave.net/${id}`;
  }

  get<T>(uri: string): Observable<T> {
    const url = this.uriToUrl(uri);
    return this.httpClient.get<T>(url);
  }
}