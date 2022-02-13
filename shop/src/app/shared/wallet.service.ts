import { Injectable } from '@angular/core';

import Web3Modal from "web3modal";
import { ethers, Signer } from 'ethers';

import { concat, from, Observable, of, ReplaySubject } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private signer = new ReplaySubject<Signer | null>(1);
  readonly signer$: Observable<Signer | null> = this.signer.asObservable();

  readonly address$: Observable<string> = this.signer$.pipe(
    mergeMap(s => {
      if (s === null) {
        return of('');
      } else {
        return from(s.getAddress());
      }
    })
  );

  readonly isConnected$: Observable<boolean> = concat(
    of(false),
    this.signer$.pipe(
      map(x => x !== null)
    )
  );

  readonly isAdmin$ = this.signer$.pipe(
    mergeMap(s => this.isConnectedWalletAdmin(s))
  )

  constructor() {
    this.checkWalletUnlocked();
  }

  private checkWalletUnlocked() {
    const { ethereum } = window as any;
    if (!ethereum) {
      return;
    }

    const provider = new ethers.providers.Web3Provider(ethereum);
    this.subscribeProviderEvents(provider);
    const signer = provider.getSigner();

    from(signer.getAddress()).subscribe(x => {
      this.signer.next(signer);
    }, () => {
      // We are not connected.
      this.signer.next(null);
    })
  }


  private hasMetamaskInstalled(): boolean {
    const { ethereum } = window as any;

    return !!ethereum;
  }

  connectWallet() {
    // TODO Stop if wallet is already connected.
    if (!this.hasMetamaskInstalled()) {
      // Later if more connect options are available we can continue here.
      console.error('The browser has no Metamask extension installed');
      return;
    }

    const providerOptions = {
      /* See Provider Options Section ofr web3modal */
    };

    const web3Modal = new Web3Modal({
      network: "mainnet", // optional
      cacheProvider: true, // optional
      providerOptions // required
    });

    from(web3Modal.connect()).pipe(
      map(instance => new ethers.providers.Web3Provider(instance)),
      tap(provider => this.subscribeProviderEvents(provider)),
      map(provider => provider.getSigner())
    ).subscribe(signer => {
      // To sign a simple string, which are used for
      // logging into a service, such as CryptoKitties,
      // pass the string in.

      this.signer.next(signer);
    }, () => {
      // user closed modal. Do nothing.
    });
  }

  private subscribeProviderEvents(provider: ethers.providers.Web3Provider) {
    // Subscribe to provider connection
    provider.on("connect", (info: { chainId: number }) => {
      console.log(info);
    });

    // Subscribe to provider disconnection
    provider.on("disconnect", (error: { code: number; message: string }) => {
      console.log(error);
    });
  }

  private isConnectedWalletAdmin(signer: Signer | null): Observable<boolean> {
    if (signer === null) {
      return of(false);
    } else {
      // Check the smart contract and if the current wallet owns the ID 0 token.
      return of(true);
    }
  }
}
