import { Injectable } from '@angular/core';

import Web3Modal from "web3modal";
import { ethers, providers, Signer } from 'ethers';

import { BehaviorSubject, EMPTY, from, Observable } from 'rxjs';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';
import { ShopError } from '../shared';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private signer = new BehaviorSubject<Signer | null>(null);
  readonly address$: Observable<string> = this.signer.pipe(
    mergeMap(s => (s === null) ? EMPTY : from(s.getAddress())),
    catchError(e => {
      console.error(e);
      this.signer.next(null);
      return EMPTY;
    })
  );
  readonly isConnected$: Observable<boolean> = this.signer.pipe(
    map(s => s !== null)
  );

  constructor() {
    this.checkWalletUnlocked();
  }

  private checkWalletUnlocked() {
    const { ethereum } = window as any;
    if (!ethereum) {
      return;
    }

    const provider = new ethers.providers.Web3Provider(ethereum, environment.network);
    this.subscribeProviderEvents(provider);
    const signer = provider.getSigner();
    this.signer.next(signer);
  }

  private hasMetamaskInstalled(): boolean {
    const { ethereum } = window as any;

    return !!ethereum;
  }

  connectWallet(): Observable<Signer> {
    // TODO Stop if wallet is already connected.
    if (!this.hasMetamaskInstalled()) {
      // Later if more connect options are available we can continue here.
      throw new ShopError('The browser has no Metamask extension installed');
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
      tap(signer => this.signer.next(signer)),
      catchError(e => {
        console.error(e);
        return EMPTY;
      })
    );
  }

  private subscribeProviderEvents(provider: providers.Provider) {
    // Subscribe to provider connection
    provider.on("connect", (info: { chainId: number }) => {
      console.log(info);
    });

    // Subscribe to accounts change
    provider.on("accountsChanged", (accounts: string[]) => {
      console.log(accounts);
    });

    // Subscribe to provider disconnection
    provider.on("disconnect", (error: { code: number; message: string }) => {
      console.log(error);
    });

    provider.on("error", (error: any) => {
      console.log(error);
    });

    provider.on("network", (newNetwork, oldNetwork) => {
      // When a Provider makes its initial connection, it emits a "network"
      // event with a null oldNetwork along with the newNetwork. So, if the
      // oldNetwork exists, it represents a changing network
      console.log(newNetwork);
      console.log(oldNetwork);
    });
  }
}
