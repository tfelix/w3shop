import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { BundlrService } from 'src/app/blockchain/upload/bundlr.service';

@Component({
  selector: 'w3s-bundlr-balance',
  templateUrl: './bundlr-balance.component.html',
})
export class BundlrBalanceComponent {

  inProgress = false;

  bundlrBalance$: Observable<string>;
  availableUploadBytes$: Observable<number>;

  constructor(
    private readonly bundlrService: BundlrService
  ) {
  }

  /**
   * We need to sign into bundlr if this is not the case to display the costs.
   */
  connectBundlr() {
    this.updateBundlrBalance();
  }

  /**
   * Preloads your bundlr account to upload the given amount of data in MB.
   */
  preload(nMegaBytes: number) {
    // TODO it makes probably sense to decouple the Bundlr client from the download service to not pollute it with this additional
    // interface. For now its directly added to the service.
    const nBytes = nMegaBytes * 1024 * 1024;
    this.bundlrService.fund(nBytes).subscribe(_ => {
      this.updateBundlrBalance();
    });
  }

  private updateBundlrBalance() {
    this.bundlrBalance$ = this.bundlrService.getCurrentBalance();
    this.availableUploadBytes$ = this.bundlrService.bytesToUpload();
  }
}
