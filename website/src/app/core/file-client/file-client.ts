import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ShopError } from "../shop-error";

export interface FileClient {
  get<T>(uri: string): Observable<T>
}

@Injectable({
  providedIn: 'root'
})
export class ArweaveClient implements FileClient {
  constructor(
    private readonly httpClient: HttpClient
  ) {
  }


  private uriToUrl(uri: string): string {
    if (!uri.startsWith('ar:')) {
      throw new ShopError('Requested uri did not start with \'ar:\' prefix: ' + uri);
    }

    const id = uri.slice(3);

    return `https://arweave.net/${id}`;
  }

  get<T>(uri: string): Observable<T> {
    const url = this.uriToUrl(uri);
    return this.httpClient.get<T>(url);
  }
}