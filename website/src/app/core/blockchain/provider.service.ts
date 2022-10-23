import { Injectable } from '@angular/core';

import Web3Modal from "web3modal";
import { ethers } from 'ethers';

import { BehaviorSubject, concat, EMPTY, from, merge, Observable, of, Subject } from 'rxjs';
import { catchError, map, mergeMap, share, shareReplay } from 'rxjs/operators';

import { ShopError } from '../shop-error';
import { NetworkService } from './network.service';

@Injectable({
  providedIn: 'root'
})
export class ProviderService {
  private readonly providerOptions = {};

  private readonly web3Modal = new Web3Modal({
    cacheProvider: true, // optional
    providerOptions: this.providerOptions // required
  });

  // Build the provider generation stream
  private provider = new Subject<ethers.providers.Web3Provider | null>();
  readonly provider$ = this.provider.asObservable()
    .pipe(shareReplay(1));

  readonly signer$: Observable<ethers.Signer | null>;
  readonly address$: Observable<string | null>;
  readonly isWalletConnected$: Observable<boolean>;

  private chainIdUpdate = new Subject();
  readonly chainId$: Observable<number | null>;

  constructor(
    private readonly networkService: NetworkService
  ) {
    this.signer$ = this.buildSignerObs();
    this.address$ = this.buildAddressObs();
    this.isWalletConnected$ = this.buildIsWalletConnectedObs();
    this.chainId$ = this.buildChainIdObs();

    this.tryWalletReconnect();
  }

  private buildChainIdObs(): Observable<number | null> {
    const initialChainId$ = this.provider$.pipe(
      mergeMap(provider => {
        if (provider == null) {
          return of(null);
        } else {
          return from(provider.getNetwork()).pipe(
            map(network => network.chainId),
            catchError(e => {
              // When the wallet is initialized with a network preset there is an error thrown when on another
              // network. Handle this better.
              if (e.code === 'NETWORK_ERROR') {
                // In case of a wrong network error we can still extract chain ID.
                return of(e.detectedNetwork.chainId);
              }
              return of(null);
            }),
          )
        }
      })
    );

    const updatedChainId$ = this.chainIdUpdate.asObservable();

    return merge(
      initialChainId$,
      updatedChainId$
    ).pipe(
      shareReplay(1)
    );
  }

  private buildSignerObs(): Observable<ethers.Signer | null> {
    return this.provider$.pipe(
      map(p => {
        if (p) {
          return p.getSigner();
        } else {
          return null;
        }
      }),
      shareReplay(1)
    );
  }

  private buildAddressObs(): Observable<string | null> {
    return this.provider$.pipe(
      mergeMap(s => (s === null) ? of(null) : s.getSigner().getAddress()),
      shareReplay(1)
    );
  }

  private buildIsWalletConnectedObs(): Observable<boolean> {
    return concat(
      of(false),
      this.provider$.pipe(map(x => x != null)),
    ).pipe(shareReplay(1));
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
        this.subscribeProviderEvents(window.ethereum);
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        // listAccounts() actually does not show the wallet popup and is a better UX here.
        from(provider.listAccounts())
          .subscribe(accounts => {
            // Metamask should return an empty array if its not unlocked.
            if (accounts.length > 0) {
              this.provider.next(provider);
            }
          },
            _ => { } // do noting when errored (means unconnected)
          );
        return;
      }
    }

    /*
    // Get the connector for the cachedProviderName
    const connector = (this.web3Modal as any).providerController.providerOptions[cachedProviderName].connector;

    from(connector()).pipe(
      map(proxy => new ethers.providers.Web3Provider(proxy)),
      mergeMap(provider => provider.listAccounts())
    ).subscribe(
      _ => { this.provider.next(provider); },
      _ => { } // do noting when errored (means unconnected)
    );*/
  }

  switchNetworkToSelected() {
    const targetNetwork = this.networkService.getExpectedNetwork();

    this.provider$.pipe(
      mergeMap(provider => {
        if (provider == null) {
          return EMPTY;
        }

        return from(provider.send('wallet_switchEthereumChain', [{ chainId: targetNetwork.walletNetwork.chainId }])).pipe(
          catchError(err => {
            if (err.code === 4902) {
              // Chain was missing from the provider. Try adding this chain.
              return provider.send('wallet_addEthereumChain', [targetNetwork.walletNetwork]);
            } else {
              throw err;
            }
          })
        );
      }),
      catchError(err => {
        throw new ShopError('Something went wrong while trying to switch networks', err);
      })
    ).subscribe();
  }

  connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      from(provider.send('eth_requestAccounts', []))
        .subscribe(accounts => {
          // Metamask should return an empty array if its not unlocked.
          if (accounts.length > 0) {
            this.provider.next(provider);
          }
        },
          err => {
            if (err.code === 4001) {
              // User cancelled the connect request, handle the error
            }
            if (err.code === -32002) {
              // Wallet is already processing the account request (prob. user has not entered the password)
              throw new ShopError('Please unlock your wallet to proceed');
            }
          });
    }
  }

  // TODO Also unsubsribe from the events
  private subscribeProviderEvents(provider: any | null) {
    if (provider == null) {
      return;
    }

    // Subscribe to accounts change
    provider.on("accountsChanged", (accounts: string[]) => {
      if (accounts.length === 0) {
        // User logged out/disconnected the wallet.
        console.log('Wallet logged out');
        this.provider.next(null);
      }
    });

    // Subscribe to chainId change
    provider.on("chainChanged", (chainId: string) => {
      this.chainIdUpdate.next(parseInt(chainId));
    });
  }
}
