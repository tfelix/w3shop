import { Contract, ethers } from 'ethers';
import { Observable } from 'rxjs';
import { map, shareReplay, take, tap } from 'rxjs/operators';
import { WalletError } from 'src/app/core';
import { ProviderService } from './provider.service';

export abstract class ContractService {

  constructor(
    protected readonly providerService: ProviderService
  ) { }

  private makeContract(
    contractAddress: string,
    abi: string[],
    providerSigner: ethers.providers.Provider | ethers.Signer
  ): Contract {
    return new ethers.Contract(contractAddress, abi, providerSigner);
  }

  protected getProviderOrThrow(): Observable<ethers.providers.Provider> {
    return this.providerService.provider$.pipe(
      tap(p => {
        if (p === null) {
          throw new WalletError('Please connect a wallet to continue');
        }
      }),
      take(1),
      shareReplay(1)
    );
  }

  private getSignerOrThrow(): Observable<ethers.Signer> {
    return this.providerService.signer$.pipe(
      tap(p => {
        if (p === null) {
          throw new WalletError('Please connect a wallet to continue');
        }
      }),
      take(1),
      shareReplay(1)
    );
  }

  protected getSignerContractOrThrow(contractAddress: string, abi: string[]): Observable<Contract> {
    return this.getSignerOrThrow().pipe(
      map(signer => this.makeContract(contractAddress, abi, signer)),
      shareReplay(1)
    );
  }

  protected getProviderContractOrThrow(contractAddress: string, abi: string[]): Observable<Contract> {
    return this.getProviderOrThrow().pipe(
      map(provider => this.makeContract(contractAddress, abi, provider)),
      shareReplay(1)
    );
  }
}