import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ShopError } from "../shop-error";
import { FileClient } from "./arweave-file-client";

@Injectable({
  providedIn: 'root'
})
export class FileHttpClient implements FileClient {

  constructor(
    private readonly http: HttpClient
  ) {
  }

  get<T>(uri: string): Observable<T> {
    if (!(uri.startsWith('http://') && uri.startsWith('https://'))) {
      throw new ShopError('Uri must start with http or https');
    }

    return this.http.get<T>(uri);
  }
}