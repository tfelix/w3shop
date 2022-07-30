import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { URI, URL } from "src/app/shared";
import { ShopError } from "../shop-error";
import { FileClient } from "./file-client";

@Injectable({
  providedIn: 'root'
})
export class FileHttpClient implements FileClient {

  constructor(
    private readonly http: HttpClient
  ) {
  }

  toURL(uri: URI): URL {
    this.requireValidUri(uri);

    return uri as URL;
  }

  get<T>(uri: URI): Observable<T> {
    this.requireValidUri(uri);

    return this.http.get<T>(uri);
  }

  private requireValidUri(uri: URI) {
    if (!uri.startsWith('http://') && !uri.startsWith('https://')) {
      throw new ShopError('Uri must start with http or https');
    }
  }
}