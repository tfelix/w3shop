import { Component } from '@angular/core';
import { formatEther } from 'ethers';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { MockUploadService, UploadService } from 'src/app/upload';

@Component({
  selector: 'w3s-bundlr-balance',
  templateUrl: './bundlr-balance.component.html',
})
export class BundlrBalanceComponent {

  inProgress = false;

  public what: Observable<boolean> = of(false);

  public bundlrBalance$: Observable<string> = of('');
  public availableUploadBytes$: Observable<number> = of(0);

  constructor(
    private readonly uploadService: MockUploadService
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
    this.inProgress = true;
    // TODO it makes probably sense to decouple the Bundlr client from the download service to not pollute it with this additional
    // interface. For now its directly added to the service.
    const nBytes = nMegaBytes * 1024 * 1024;
    this.uploadService.fund(nBytes).subscribe({
      next: (v) => {
        this.inProgress = false;
        this.updateBundlrBalance();
      },
      error: (e) => console.error(e),
      complete: () => this.inProgress = false
    });
  }

  withdraw() {
    this.inProgress = true;
    this.uploadService.withdraw().subscribe({
      next: (v) => {
        this.inProgress = false;
        this.updateBundlrBalance();
      },
      error: (e) => console.error(e),
      complete: () => this.inProgress = false
    });
  }

  private updateBundlrBalance() {
    this.bundlrBalance$ = this.uploadService.getCurrentBalance().pipe(
      map(balance => {
        const remainder = balance % 10n;

        return formatEther(balance - remainder);
      })
    );
    this.availableUploadBytes$ = this.uploadService.getUploadableBytesCount();
  }
}
