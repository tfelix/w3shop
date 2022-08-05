import { Injectable } from "@angular/core";
import { FileClientFactory } from "src/app/core";

import { NftToken } from "../nft-resolver.service";


@Injectable({
  providedIn: 'root'
})
export class NftDownloadService {

  constructor(
    private readonly fileClientFactory: FileClientFactory,
  ) { }

  downloadOwnedFile(nft: NftToken) {
    const fileClient = this.fileClientFactory.getResolver(nft.payload);

    fileClient.download(nft.payload)
      .subscribe(x => console.log('works', x));
  }
}