import { Injectable } from '@angular/core';

import Web3Modal from "web3modal";
import { ethers } from 'ethers';

import { BehaviorSubject, EMPTY, from, merge, Observable, of, Subject } from 'rxjs';
import { catchError, map, mergeMap, shareReplay, tap } from 'rxjs/operators';

import { ShopError } from '../shop-error';
import { ChainIds, ChainIdService } from './chain-ids.service';

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
    ),
  ).pipe(
    shareReplay(1),
    catchError(e => {
      // When the wallet is initialized with a network preset there is an error thrown when on another
      // network. Handle this better.
      console.error(e);
      return of(null);
    })
  );

  constructor(
    private readonly chainIdService: ChainIdService
  ) {
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
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        console.debug('Found injected provider, checking accounts');
        from(provider.listAccounts())
          .subscribe(accounts => {
            // Metamask should return an empty array if its not unlocked.
            if (accounts.length > 0) {
              this.connectWallet();
            }
          },
            _ => { } // do noting when errored (means unconnected)
          );

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

  switchNetworkToSelected() {
    // TODO Put that functionality into the provider service itself
    this.provider$.pipe(
      mergeMap(provider => {
        if (provider == null) {
          return EMPTY;
        }

        let network: any;
        const targetNetworkId = this.chainIdService.expectedChainId();

        if (targetNetworkId === ChainIds.ARBITRUM) {
          network = ProviderService.NETWORK_ARBITRUM_ONE;
        } else if (targetNetworkId === ChainIds.ARBITRUM_RINKEBY) {
          network = ProviderService.NETWORK_ARBITRUM_RINKEBY;
        } else {
          throw new ShopError('Unknown configured network.');
        }

        return provider.send('wallet_addEthereumChain', [network]);
      })
    ).subscribe()
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
      console.log('Event chainId: ' + parseInt(chainId));
      this.chainId.next(parseInt(chainId));
    });

    /*
    provider.on("error", (error: any) => {
      console.log(error);
    });*/
  }

    // TODO Maybe include this in the ChainId service?
    private static readonly NETWORK_ARBITRUM_RINKEBY = {
      chainId: "0x66eeb",
      rpcUrls: ["https://rinkeby.arbitrum.io/rpc"],
      chainName: "Arbitrum Testnet",
      nativeCurrency: {
        name: "ETH",
        symbol: "ETH",
        decimals: 18
      },
      blockExplorerUrls: ["https://testnet.arbiscan.io/"]
    };

    private static readonly NETWORK_ARBITRUM_ONE = {
      chainId: "0x42161",
      rpcUrls: ["https://arb1.arbitrum.io/rpc"],
      chainName: "Arbitrum One",
      nativeCurrency: {
        name: "ETH",
        symbol: "ETH",
        decimals: 18
      },
      blockExplorerUrls: ["https://arbiscan.io/"]
    };
}
