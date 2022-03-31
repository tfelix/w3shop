import { Observable, of } from "rxjs";
import { delay } from "rxjs/operators";
import { SmartContractFacade } from "./smart-contract-facade";

export class MockSmartContractFacade implements SmartContractFacade {

  getCurrentConfig(contractAdresse: string): Observable<string> {
    // http://arweave.net/bfquwFXgNsPUhnrnZJj2xaYQjUrOWUUErSc7V5MwCA0
    return of('ar:000000000000000000000000').pipe(
      delay(1300)
    )
  }
}