import { Observable } from "rxjs";

export interface SmartContractFacade {
  getCurrentConfig(contractAdresse: string): Observable<string>;
}

