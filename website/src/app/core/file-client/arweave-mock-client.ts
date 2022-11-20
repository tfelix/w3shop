import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";
import { map } from "rxjs/operators";
import { ShopConfigV1, URI, URL } from "src/app/shared";
import { ShopError } from "../shop-error";
import { Download, FileClient } from "./file-client";

const hardcodedShopConfig: ShopConfigV1 = {
  version: "1",
  shopName: "Example Shop",
  description: "# Example Web3 Shop\n---\nAn awesome example shop.",
  shortDescription: "small example description",
  currency: '0x0',
  contract: {
    address: '0x0000000000000000000000000000000000001337',
    chainId: 1
  },
  keywords: ["mp3", "cosplay", "fotography"],
  items: {
    '7': 'ar://i1.json'
  }
}

@Injectable({
  providedIn: 'root'
})
export class ArweaveMockClient implements FileClient {

  constructor(
    private readonly http: HttpClient
  ) {
  }

  download(uri: string): Observable<Download> {
    const url = this.toURL(uri);

    return this.http.get(url, {
      responseType: 'blob'
    }).pipe(
      map(body => {
        return {
          progress: 100,
          state: 'DONE',
          content: body
        };
      })
    );
  }

  toURL(uri: URI): URL {
    if (uri === "ar://i1.json") {
      return 'http://localhost:4200/assets/mocks/i1.json';
    } else if (uri === 'ar://i1.json') {
      return 'http://localhost:4200/assets/mocks/i2.json';
    } else if (uri === 'ar://AAAAAAAAAAAAAAAAAA') {
      return 'http://localhost:4200/assets/mocks/meta-i1.json';
    } else if (uri === 'ar://FAKE-PAYLOAD') {
      return 'http://localhost:4200/assets/ethereum-logo.png';
    } else {
      throw new ShopError('Unknown URI: ' + uri);
    }
  }

  get<T>(uri: string): Observable<T> {
    if (uri === 'ar://AAAAAAAAAAAAAAAAAAAAAAAAAAAA') {
      console.debug(`Fetching URI: ${uri} -> Hardcoded Shop Config`);
      return of(JSON.stringify(hardcodedShopConfig)) as any;
    } else if (uri === "ar://i1.json") {
      console.debug(`Fetching URI: ${uri} -> http://localhost:4200/assets/mocks/i1.json`);
      return this.http.get<T>('/assets/mocks/i1.json');
    } else if (uri === "ar://i2.json") {
      console.debug(`Fetching URI: ${uri} -> http://localhost:4200/assets/mocks/i2.json`);
      return this.http.get<T>('/assets/mocks/i2.json');
    } else if (uri === 'ar://AAAAAAAAAAAAAAAAAA') {
      // Fake Item NFT Metadata
      console.debug(`Fetching URI: ${uri} -> http://localhost:4200/assets/mocks/meta-i1.json`);
      return this.http.get<T>('/assets/mocks/meta-i1.json');
    } else {
      throw new ShopError('Unknown URI: ' + uri);
    }
  }
}