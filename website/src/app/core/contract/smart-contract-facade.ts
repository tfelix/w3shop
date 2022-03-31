import { Observable } from "rxjs";

export interface SmartContractFacade {
  /**
   * Queries the current Arweave document that contains the shop information.
   *
   * @param contractAdresse
   */
  getCurrentConfig(contractAdresse: string): Observable<string>;
}

