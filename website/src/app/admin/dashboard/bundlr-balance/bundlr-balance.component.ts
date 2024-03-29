import { Component } from '@angular/core';
import { BigNumber, ethers } from 'ethers';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BundlrService } from 'src/app/updload';

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
    this.inProgress = true;
    // TODO it makes probably sense to decouple the Bundlr client from the download service to not pollute it with this additional
    // interface. For now its directly added to the service.
    const nBytes = nMegaBytes * 1024 * 1024;
    this.bundlrService.fund(nBytes).subscribe(
      _ => {
        this.inProgress = false;
        this.updateBundlrBalance();
      },
      err => {
        this.inProgress = false;

        throw err;
      }
    );
  }

  withdraw() {
    this.inProgress = true;
    this.bundlrService.withdraw().subscribe(
      _ => {
        this.inProgress = false;
        this.updateBundlrBalance();
      },
      err => {
        this.inProgress = false;

        throw err;
      }
    );
  }

  private updateBundlrBalance() {
    this.bundlrBalance$ = this.bundlrService.getCurrentBalance().pipe(
      map(balance => {
        const balanceNum = BigNumber.from(balance);
        const remainder = balanceNum.mod(1e10);

        return ethers.utils.formatEther(balanceNum.sub(remainder));
      })
    );
    this.availableUploadBytes$ = this.bundlrService.getUploadableBytesCount();
  }
}
