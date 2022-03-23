import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';

import { WalletService } from '../wallet.service';
import { BlockchainService, DeployResult } from './blockchain';


/**
 * This service controls the interaction with the blockchain and can be easily be mocked
 * away for testing.
 */
@Injectable({
  providedIn: 'root'
})
export class MockBlockchainService implements BlockchainService {
  private isAdmin = new BehaviorSubject(false);

  readonly isAdmin$ = this.isAdmin.asObservable();

  constructor(
    private readonly walletService: WalletService
  ) {
    this.checkConnectedWalletAdmin();
  }

  deployShopContract(): Observable<DeployResult> {
    const result: DeployResult = {
      ownerAddr: '0xd36e44EFf4160F78E5088e02Fe8406D7638f73b4',
      contractAddr: '0xe7e07f9dff6b48eba32641c53816f25368297d22'
    };

    console.debug('Mock: Deploying shop contract...');

    return of(result).pipe(
      delay(1500)
    );
  }

  private checkConnectedWalletAdmin() {
    this.walletService.adress$.pipe(
      map(addr => addr === '0xd36e44EFf4160F78E5088e02Fe8406D7638f73b4'),
    ).subscribe(isAdmin => this.isAdmin.next(isAdmin));
  }
}
