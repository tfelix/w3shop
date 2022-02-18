import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';

import { CeramicService, WalletService } from 'src/app/core';

enum SetupProcess {
  WAIT_FOR_CONTRACT_DEPLOYMENT
}

@Injectable({
  providedIn: 'root'
})
export class SetupShopService {

  constructor(
    private readonly walletService: WalletService,
    private readonly ceramicService: CeramicService,
  ) { }

  createShop() {
    this.deployShopContract().pipe(
      tap(contractAddr => {
        console.log('Deployed shop contract: ' + contractAddr);
        localStorage.setItem('shopContract', contractAddr);
      })
    );
  }

  /**
   *
   */
  private deployShopContract(): Observable<string> {
    // Something like this.
    // this.walletService.deployContract();
    return of("0xe7e07f9dff6b48eba32641c53816f25368297d22").pipe(delay(1500));
  }

  private setupCeramicDocument(contractAddr: string): Observable<string> {
    return of('');
  }
}
