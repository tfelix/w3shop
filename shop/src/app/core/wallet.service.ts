import { Injectable } from '@angular/core';

import Web3Modal from "web3modal";
import { ethers, providers, Signer } from 'ethers';

import { BehaviorSubject, EMPTY, from, Observable, of, ReplaySubject, Subject } from 'rxjs';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';

import { ShopError } from '../shared';
import { Network } from './network';

import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private provider = new ReplaySubject<ethers.providers.Web3Provider | null>(null);

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
    this.checkWalletUnlocked();
  }

  private checkWalletUnlocked() {
    const { ethereum } = window as any;
    if (!ethereum) {
      return;
    }

    const provider = new ethers.providers.Web3Provider(ethereum, environment.network);

    // Check if it is connected.
    from(provider.listAccounts()).subscribe(accounts => {
      const isConnected = accounts.length > 0;
      this.isConnected.next(isConnected);

      if (isConnected) {
        this.subscribeProviderEvents(provider);
        this.detectNetwork(provider);
        this.provider.next(provider);
      }
    });

    /*
    These events work

    ethereum.on('chainChanged', x => console.log(x));
    ethereum.on('accountsChanged', x => console.log(x));
    ethereum.on('disconnect', x => console.log(x));
    ethereum.on('connect', x => console.log(x));
*/
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

    const walletSub = new Subject<Signer>();

    from(web3Modal.connect()).pipe(
      map(instance => new ethers.providers.Web3Provider(instance)),
      tap(provider => {
        this.subscribeProviderEvents(provider);
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

    return walletSub.asObservable();
  }

  private detectNetwork(provider: ethers.providers.Provider) {
    console.log('Trying to detect network...');
    from(provider.getNetwork()).subscribe(n => {
      console.log('Network: ', n);
      this.network.next(n);
    });
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
      if (error.code === 'NETWORK_ERROR') {
        this.network.next(error.detectedNetwork);
        return;
      }
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
