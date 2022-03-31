import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { ProviderService } from "./provider.service";


@Injectable({
  providedIn: 'root'
})
export class WalletService {

  constructor(
    private readonly providerService: ProviderService
  ) {
  }

  isAdmin(): Observable<boolean> {
    return this.providerService.adress$.pipe(
      map(addr => addr === '0xd36e44EFf4160F78E5088e02Fe8406D7638f73b4'),
    )
  }

  getAddress(): Observable<string> {
    return this.providerService.adress$;
  }

  /* How to query a SC
  test() {
    const sushi = {
      address: "0x6B3595068778DD592e39A122f4f5a5cF09C90fE2",
      abi: [
        "function balanceOf(address account) public view returns (uint256 balance)",
      ],
    };

    this.providerService.provider$.pipe(
      mergeMap(p => from(p.getBlockNumber()))
    ).subscribe(x => {
      console.log(x);
    }, err => {
      console.log(err);
    })

    combineLatest([
      this.providerService.adress$,
      this.providerService.provider$
    ]).pipe(
      mergeMap(([addr, provider]) => {
        const contract = new ethers.Contract(sushi.address, sushi.abi, provider);

        return from(contract.balanceOf(addr));
      })
    ).subscribe(x => {
      console.log(utils.formatEther(x as BigNumber));
    }, err => {
      console.log(err);
    })
  }*/

  /*
  deployShopContract(): Observable<DeployResult> {
    const result: DeployResult = {
      ownerAddr: '0xd36e44EFf4160F78E5088e02Fe8406D7638f73b4',
      contractAddr: '0xe7e07f9dff6b48eba32641c53816f25368297d22'
    };

    console.debug('Mock: Deploying shop contract...');

    return of(result).pipe(
      delay(1500)
    );
  }*/
}