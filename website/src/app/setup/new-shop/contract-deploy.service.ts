import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";
import { delay } from "rxjs/operators";

export interface DeployResult {
  ownerAddr: string;
  contractAddr: string;
}

@Injectable({
  providedIn: 'root'
})
export class DeployShopContractService {
  deployShopContract(): Observable<DeployResult> {
    const result: DeployResult = {
      ownerAddr: '0xd36e44EFf4160F78E5088e02Fe8406D7638f73b4',
      contractAddr: '0xe7e07f9dff6b48eba32641c53816f25368297d22'
    };

    console.debug('Mock: Deploying shop contract...');

    return of(result).pipe(
      delay(1500)
    );
  }
}