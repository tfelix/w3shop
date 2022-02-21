import { Injectable } from '@angular/core';
import { CartService, WalletService } from '../core';
import { ErrorService } from '../shared/error.service';

/**
 * This service uses the content of the shopping cart to build
 * a proof and initiate a smart contract interaction.
 *
 */
@Injectable({
  providedIn: 'root'
})
export class CheckoutService {

  constructor(
    private readonly cartService: CartService,
    private readonly walletService: WalletService,
    private readonly errorService: ErrorService
  ) { }

  buy() {
    this.walletService.connectWallet()
      .subscribe(signer => {
        console.log('INITIATE BUY TX');

      }, e => {
        this.errorService.showError('Please connect a wallet first.', 'No Wallet connected');
      });
  }
}
