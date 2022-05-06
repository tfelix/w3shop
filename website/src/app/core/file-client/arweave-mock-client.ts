import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";
import { ShopConfigV1 } from "src/app/shared";
import { ShopError } from "../shop-error";
import { FileClient } from "./arweave-file-client";

const shopConfig: ShopConfigV1 = {
  version: "1",
  shopName: "tfelix.eth Shop",
  description: "# MyUber Web3 Shop\n---\nDas ist mein eigener Shop der super toll ist.",
  shortDescription: "tag line of my shop",
  keywords: ["mp3", "cosplay", "fotography"],
  itemUris: [
    "ar:i1.json",
  ]
}

@Injectable({
  providedIn: 'root'
})
export class ArweaveMockClient implements FileClient {

  constructor(
    private readonly http: HttpClient
  ) {
  }

  get<T>(uri: string): Observable<T> {
    if (uri === 'AAAAAAAAAAAAAAAAAAAAAAAAAAAA') {
      return of(shopConfig as any);
    } else if (uri === "ar:i1.json") {
      return this.http.get<T>('/assets/i1.json');
    } else if (uri === 'ar://AAAAAAAAAAAAAAAAAA') {
      // Fake Item NFT Metadata
      return this.http.get<T>('/assets/meta-i1.json');
    } else {
      throw new ShopError('Unknown URI');
    }
  }
}