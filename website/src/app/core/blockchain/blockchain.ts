import { Observable } from "rxjs";

export interface DeployResult {
  ownerAddr: string;
  contractAddr: string;
}

export interface BlockchainService {
  readonly isAdmin$: Observable<boolean>;

  deployShopContract(): Observable<DeployResult>;
}