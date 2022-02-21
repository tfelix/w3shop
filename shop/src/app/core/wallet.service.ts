import { Injectable } from '@angular/core';

import Web3Modal from "web3modal";
import { ethers, Signer } from 'ethers';

import { concat, EMPTY, from, Observable, of, ReplaySubject } from 'rxjs';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';
import { ShopError } from '../shared';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private provider = new ReplaySubject<ethers.providers.Web3Provider | null>(1);

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

    const provider = new ethers.providers.Web3Provider(ethereum, "any");
    this.subscribeProviderEvents(provider);

    const signer = provider.getSigner();

    from(signer.getAddress()).subscribe(_ => {
      this.provider.next(provider);
      this.signer.next(signer);
    }, () => {
      // Catch the error if we are not connected.
      this.signer.next(null);
    })
  }


  private hasMetamaskInstalled(): boolean {
    const { ethereum } = window as any;

    return !!ethereum;
  }

  connectWallet(): Observable<ethers.providers.JsonRpcSigner> {


    // TODO Stop if wallet is already connected.
    if (!this.hasMetamaskInstalled()) {
      // Later if more connect options are available we can continue here.
      throw new ShopError('The browser has no Metamask extension installed');
      return EMPTY;
    }

    const providerOptions = {
      /* See Provider Options Section ofr web3modal */
    };

    const web3Modal = new Web3Modal({
      network: environment.network,
      cacheProvider: true, // optional
      providerOptions // required
    });

    return from(web3Modal.connect()).pipe(
      map(instance => new ethers.providers.Web3Provider(instance)),
      tap(provider => this.subscribeProviderEvents(provider)),
      map(provider => provider.getSigner()),
      tap(s => this.signer.next(s)),
      catchError(e => EMPTY)
    );
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

    provider.on("network", (newNetwork, oldNetwork) => {
      // When a Provider makes its initial connection, it emits a "network"
      // event with a null oldNetwork along with the newNetwork. So, if the
      // oldNetwork exists, it represents a changing network
      console.log(newNetwork);
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
