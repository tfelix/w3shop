import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { WalletService } from '../wallet.service';
import { BlockchainService } from './blockchain';



/**
 * This service controls the interaction with the blockchain and can be easily be mocked
 * away for testing.
 */
@Injectable({
  providedIn: 'root'
})
export class MockBlockchainService implements BlockchainService {

  readonly isAdmin$: Observable<boolean>;

  constructor(
    private readonly walletService: WalletService
  ) {
    this.isAdmin$ = this.walletService.isConnected$;
  }

  private isConnectedWalletAdmin(): Observable<boolean> {
    // Check the smart contract and if the current wallet owns the ID 0 token.
    return of(true);
  }
}
