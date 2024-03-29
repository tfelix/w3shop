import { Injectable, NgZone } from '@angular/core';

import { ethers } from 'ethers';

import { concat, EMPTY, from, merge, Observable, of, Subject } from 'rxjs';
import { catchError, map, mergeMap, shareReplay, take } from 'rxjs/operators';

import { NetworkService } from '../core/network.service';
import { ShopError } from 'src/app/core';

@Injectable({
  providedIn: 'root'
})
export class ProviderService {
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
    private readonly networkService: NetworkService,
    private readonly ngZone: NgZone
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
          );
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
      // The signer address in ethers is "broke". At least the casing is not
      // equal to the real casing. We send the eth command to the provider in
      // order to get the proper casing.
      // mergeMap(s => (s === null) ? of(null) : s.getSigner().getAddress()),
      mergeMap(p => {
        if (!p) {
          return of(null);
        } else {
          return from(p.send('eth_requestAccounts', [])).pipe(
            map(accs => accs[0])
          );
        }
      }),
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
    console.info('Trying to reconnect wallet...');
    // This is a bit hacky, we need to try to check if there is already a wallet connected without calling connect()
    // to avoid the pop up, which is a bad UX.
    // See: https://github.com/Web3Modal/web3modal/issues/319

    // Get the cached provider from LocalStorage
    this.tryConnectMetamask();
    /*
    const cachedProviderName = this.web3Modal.cachedProvider;
    if (!cachedProviderName) {
      console.debug('Web3Modal has no cached provider');
      return;
    }*/

    // We must handle the injected provider differently as this is not inside the providerOptions object.
    /*
    Currently web3Modal is somewhat broken.
    if (cachedProviderName === 'injected') {
      this.tryConnectMetamask();
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

  private tryConnectMetamask() {
    if (typeof window.ethereum !== 'undefined') {
      this.subscribeProviderEvents(window.ethereum);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      // listAccounts() actually does not show the wallet popup and is a better UX here.
      from(provider.listAccounts())
        .subscribe(accounts => {
          // Metamask should return an empty array if its not unlocked.
          if (accounts.length > 0) {
            console.log('Connected: Metamask');
            this.provider.next(provider);
          }
        },
          _ => { } // do noting when errored (means unconnected)
        );
      return;
    }
  }

  switchNetworkToSelected() {
    const targetNetwork = this.networkService.getExpectedNetwork();

    this.provider$.pipe(
      mergeMap(provider => {
        if (provider == null) {
          return EMPTY;
        }

        return from(
          provider.send(
            'wallet_switchEthereumChain',
            [{ chainId: targetNetwork.walletNetwork.chainId }]
          )
        ).pipe(
          catchError(err => {
            if (err.code === 4902) {
              // Chain was missing from the provider. Try adding this chain.
              return provider.send('wallet_addEthereumChain', [targetNetwork.walletNetwork]);
            } else {
              throw err;
            }
          }),
          map(() => provider)
        );
      }),
      take(1),
      catchError(err => this.handleProviderError(err, 'Something went wrong while trying to switch networks.'))
    ).subscribe(p => this.provider.next(p));
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
          err => this.handleProviderError(err, 'There was an error while connecting your wallet.'));
    }
  }

  private handleProviderError(err: any, defaultErrorMsg: string): never {
    if (err.code === 4001) {
      throw new ShopError('Request rejected. Please accept the wallet request in order to proceed.');
    }

    if (err.code === -32002) {
      // Wallet is already processing the account request (prob. user has not entered the password)
      throw new ShopError('Please unlock your wallet to proceed.');
    }

    throw new ShopError(err.message || defaultErrorMsg);
  }

  // TODO Also unsubscribe from the events
  private subscribeProviderEvents(provider: any | null) {
    if (provider == null) {
      return;
    }

    // Subscribe to accounts change
    provider.on('accountsChanged', (accounts: string[]) => {
      if (accounts.length === 0) {
        // User logged out/disconnected the wallet.
        console.log('Wallet logged out');
        this.provider.next(null);

        // External Events must "manually" be put into the Angular zone so the
        // change detection works properly.
        this.ngZone.run(() => {
          console.log('Wallet logged out');
          this.provider.next(null);
        });
      }
    });

    // Subscribe to chainId change
    provider.on('chainChanged', (chainId: string) => {
      // External Events must "manually" be put into the Angular zone so the
      // change detection works properly.
      this.ngZone.run(() => {
        console.log('ChainId changed: ' + chainId);
        this.chainIdUpdate.next(parseInt(chainId));
      });
    });
  }
}
