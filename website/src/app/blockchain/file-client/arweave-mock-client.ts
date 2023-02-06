import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ShopError } from 'src/app/core';
import { URI, URL } from 'src/app/shared';
import { MockUploadService } from 'src/app/updload';

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
    throw new ShopError('Unknown URI: ' + uri);
  }

  get<T>(uri: string): Observable<T> {
    if (uri === 'ar://CONFIGCONFIGCONFIGCONFIGCONF') {
      console.debug(`Fetching URI: ${uri} -> http://localhost:4200/assets/mocks/shop-config.json`);
      return this.http.get<T>('/assets/mocks/shop-config.json');
    } else if (uri === MockUploadService.MOCK_ARWEAVE_NFT_HASH) {
      // Fake NFT Item Metadata
      console.debug(`Fetching URI: ${uri} -> http://localhost:4200/assets/mocks/meta-i1.json`);
      return this.http.get<T>('/assets/mocks/meta-i1.json');
    } else if (uri === 'ar://BBBBBBBBBBBBBBBBBBBBBBBBBBBB') {
      // This is currently set in a dev smart contract, can be removed for newer tests.
      console.debug(`Fetching URI: ${uri} -> http://localhost:4200/assets/mocks/meta-i1.json`);
      return this.http.get<T>('/assets/mocks/meta-i1.json');
    } else if (uri === 'ar://ITEM-1.json' || uri === MockUploadService.MOCK_ARWEAVE_ITEM_META_HASH) {
      console.debug(`Fetching URI: ${uri} -> http://localhost:4200/assets/mocks/i1.json`);
      return this.http.get<T>('/assets/mocks/i1.json');
    } else {
      throw new ShopError('Unknown URI: ' + uri);
    }
  }
}