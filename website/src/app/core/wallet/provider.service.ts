import { Injectable, OnInit } from '@angular/core';

import Web3Modal from "web3modal";
import { ethers, providers, Signer } from 'ethers';

import { BehaviorSubject, EMPTY, from, Observable, ReplaySubject, Subject } from 'rxjs';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';

import { Network } from './network';

import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProviderService {
  private readonly providerOptions = { };

  private readonly web3Modal = new Web3Modal({
    network: environment.network,
    cacheProvider: true, // optional
    providerOptions: this.providerOptions // required
  });

  private provider = new BehaviorSubject<ethers.providers.Web3Provider | null>(null);

  readonly provider$ = this.provider.asObservable();
  readonly signer$ = this.provider$.pipe(
    map(p => p.getSigner())
  );
  readonly adress$: Observable<string> = this.signer$.pipe(
    mergeMap(s => s.getAddress()),
    catchError(e => {
      console.error(e);
      return EMPTY;
    })
  );

  private isConnected = new BehaviorSubject(false);
  readonly isConnected$: Observable<boolean> = this.isConnected.asObservable();

  private network = new ReplaySubject<Network>(1);
  readonly network$ = this.network.asObservable();

  constructor() {
    this.tryWalletReconnect();
  }

  private tryWalletReconnect() {
    console.debug('Trying to reconnect wallet');
    // This is a bit hacky, we need to try to check if there is already a wallet connected without calling connect()
    // to avoid the pop up, which is a bad UX.
    // See: https://github.com/Web3Modal/web3modal/issues/319

    // Get the cached provider from LocalStorage
    const cachedProviderName = this.web3Modal.cachedProvider;
    if (!cachedProviderName) {
      return;
    }

    // We must handle the injected provider differently as this is not inside the providerOptions object.
    if (cachedProviderName === 'injected') {
      if (typeof window.ethereum !== 'undefined') {
        let provider = window.ethereum;

        from(provider.request({ method: 'eth_requestAccounts' }))
          .subscribe(
            _ => { this.connectWallet() },
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

  connectWallet() {
    const walletSub = new Subject<Signer>();

    from(this.web3Modal.connect()).pipe(
      tap(w3Connect => this.subscribeProviderEvents(w3Connect)),
      map(w3Connect => new ethers.providers.Web3Provider(w3Connect)),
      tap(provider => {
        this.detectNetwork(provider);
        this.provider.next(provider);
        this.isConnected.next(true);
      }),
      map(provider => provider.getSigner()),
    ).subscribe(
      (signer) => {
        walletSub.next(signer);
        walletSub.complete();
      },
      (err) => {
        console.error(err);
        walletSub.complete();
      }
    )
  }

  private detectNetwork(provider: ethers.providers.Provider) {
    console.log('Trying to detect network...');
    from(provider.getNetwork()).subscribe(n => {
      console.log('Network: ', n);
      this.network.next(n);
    });
  }

  // TODO Also unsubsribe from the events
  private subscribeProviderEvents(provider: any) {
    // Subscribe to accounts change
    provider.on("accountsChanged", (accounts: string[]) => {
      console.log(accounts);
    });

    // Subscribe to chainId change
    provider.on("chainChanged", (chainId: number) => {
      console.log(chainId);
    });

    // Subscribe to provider connection
    provider.on("connect", (info: { chainId: number }) => {
      console.log(info);
    });

    // Subscribe to provider disconnection
    provider.on("disconnect", (error: { code: number; message: string }) => {
      console.log(error);
    });

    provider.on("error", (error: any) => {
      if (error.code === 'NETWORK_ERROR') {
        this.network.next(error.detectedNetwork);
        return;
      }
      console.log(error);
    });
  }
}
