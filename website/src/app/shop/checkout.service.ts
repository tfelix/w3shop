import { Injectable } from '@angular/core';
import { CartService, ShopError } from '../core';

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
  ) { }

  buy() {
    /*
    this.walletService.connectWallet()
      .subscribe(signer => {
        console.log('INITIATE BUY TX');
      }, e => {
        throw new ShopError('Please connect a wallet first.');
      });*/
  }
}
