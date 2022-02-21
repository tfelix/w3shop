import { Observable } from "rxjs";

export interface BlockchainService {

  readonly isAdmin$: Observable<boolean>;
}