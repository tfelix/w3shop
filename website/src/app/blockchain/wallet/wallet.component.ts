import { Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { ProviderService } from 'src/app/blockchain';
import { faWallet } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'w3s-wallet',
  templateUrl: './wallet.component.html',
})
export class WalletComponent implements OnInit {

  faWallet = faWallet;
  walletAddress$: Observable<string | null> = of(null);
  isWalletConnected$: Observable<boolean> = of(false);

  constructor(
    private readonly providerService: ProviderService
  ) {
  }

  ngOnInit(): void {
    this.walletAddress$ = this.providerService.address$.pipe(
      map(addr => {
        if (addr == null) {
          return null;
        } else {
          return addr.slice(0, 6) + '…' + addr.slice(38);
        }
      })
    );

    this.isWalletConnected$ = this.providerService.isWalletConnected$;
  }

  connectWallet() {
    this.providerService.connectWallet();
  }
}

