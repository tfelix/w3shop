import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ShopError } from 'src/app/core';
import { URI, URL } from 'src/app/shared';
import { Download, FileClient } from './file-client';

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
    if (uri === 'ar://i1.json') {
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
    if (uri === 'ar://CONFIGCONFIGCONFIGCONFIGCONF') {
      console.debug(`Fetching URI: ${uri} -> http://localhost:4200/assets/mocks/shop-config.json`);
      return this.http.get<T>('/assets/mocks/shop-config.json');
    } else if (uri === 'ar://i1.json') {
      console.debug(`Fetching URI: ${uri} -> http://localhost:4200/assets/mocks/i1.json`);
      return this.http.get<T>('/assets/mocks/i1.json');
    } else if (uri === 'ar://i2.json') {
      console.debug(`Fetching URI: ${uri} -> http://localhost:4200/assets/mocks/i2.json`);
      return this.http.get<T>('/assets/mocks/i2.json');
    // Smart Contract will very likely return an empty URL as we did not setup any items in DEV.
    } else if (uri === 'ar://AAAAAAAAAAAAAAAAAA' || uri === '') {
      // Fake Item NFT Metadata
      console.debug(`Fetching URI: ${uri} -> http://localhost:4200/assets/mocks/meta-i1.json`);
      return this.http.get<T>('/assets/mocks/meta-i1.json');
    } else {
      throw new ShopError('Unknown URI: ' + uri);
    }
  }
}