import { Injectable } from '@angular/core';
import Bundlr from '@bundlr-network/client';

@Injectable({
  providedIn: 'root'
})
export class UploadService {

  private bundlr = new Bundlr("http://node1.bundlr.network", "currencyName", "privateKey");

  // Check how the API could look like.
}