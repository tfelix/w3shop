import { Injectable } from '@angular/core';

import Web3Modal from "web3modal";
import { ethers } from 'ethers';

import { BehaviorSubject, from, merge, Observable, of, Subject } from 'rxjs';
import { map, mergeMap, shareReplay, tap } from 'rxjs/operators';

import { ShopError } from '../shop-error';
import { ChainIds } from './chain-ids.service';

@Injectable({
  providedIn: 'root'
})
export class ProviderService {
  private readonly providerOptions = {};

  private readonly web3Modal = new Web3Modal({
    cacheProvider: true, // optional
    providerOptions: this.providerOptions // required
  });

  private provider = new BehaviorSubject<ethers.providers.Web3Provider | null>(null);
  readonly provider$ = this.provider.asObservable();

  readonly address$: Observable<string | null> = this.provider$.pipe(
    mergeMap(s => (s === null) ? null : s.getSigner().getAddress()),
    shareReplay(1)
  );

  private chainId = new Subject();
  readonly chainId$: Observable<number | null> = merge(
    this.chainId.asObservable(),
    this.provider$.pipe(
      mergeMap(p => (p === null) ? of(null) : p.getNetwork()),
      map(n => (n === null) ? null : n.chainId),
    )
  );

  constructor() {
    this.tryWalletReconnect();
  }

  private tryWalletReconnect() {
    console.debug('Try to reconnect wallet');
    // This is a bit hacky, we need to try to check if there is already a wallet connected without calling connect()
    // to avoid the pop up, which is a bad UX.
    // See: https://github.com/Web3Modal/web3modal/issues/319

    // Get the cached provider from LocalStorage
    const cachedProviderName = this.web3Modal.cachedProvider;
    if (!cachedProviderName) {
      console.debug('Web3Modal has no cached provider');
      return;
    }

    // We must handle the injected provider differently as this is not inside the providerOptions object.
    if (cachedProviderName === 'injected') {
      if (typeof window.ethereum !== 'undefined') {
        let provider = window.ethereum;
        console.debug('Found injected provider, checking accounts');
        from(provider.request({ method: 'eth_requestAccounts' }))
          .subscribe(
            _ => this.connectWallet(),
            _ => { } // do noting when errored (means unconnected)
          )

        return;
      }
    }

    // Get the connector for the cachedProviderName
    const connector = (this.web3Modal as any).providerController.providerOptions[cachedProviderName].connector;

    from(connector()).pipe(
      map(proxy => new ethers.providers.Web3Provider(proxy)),
      mergeMap(provider => provider.listAccounts())
    ).subscribe(
      _ => { this.connectWallet(); },
      _ => { } // do noting when errored (means unconnected)
    );
  }

  getProvider(): ethers.providers.Web3Provider | null {
    return this.provider.value;
  }

  getSigner(): ethers.providers.JsonRpcSigner | null {
    const provider = this.provider.value;
    if (!provider) {
      return null;
    }

    return provider.getSigner();
  }

  connectWallet() {
    from(this.web3Modal.connect()).pipe(
      tap(w3Connect => this.subscribeProviderEvents(w3Connect)),
      map(w3Connect => new ethers.providers.Web3Provider(w3Connect, ChainIds.ARBITRUM_RINKEBY)),
    ).subscribe(
      provider => { this.provider.next(provider) },
      (err) => {
        throw new ShopError('The request to the wallet failed. Please unlock the wallet.', err);
      }
    )
  }

  // TODO Also unsubsribe from the events
  private subscribeProviderEvents(provider: any) {
    // Subscribe to accounts change
    provider.on("accountsChanged", (accounts: string[]) => {
      console.log(accounts);
    });

    // Subscribe to chainId change
    provider.on("chainChanged", (chainId: string) => {
      this.chainId.next(parseInt(chainId));
    });

    provider.on("error", (error: any) => {
      console.log(error);
    });
  }
}
