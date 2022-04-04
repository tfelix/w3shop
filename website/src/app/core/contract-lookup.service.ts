import { Injectable } from "@angular/core";

const shopFactoryContracts = {
  'Arbitrum One': '0x1111111111111111111111',
  'Arbitrum Rinkeby': '0x222222222222222222222'
};

@Injectable({
  providedIn: 'root'
})
export class ContractLookupService {

  // getShopFactoryContractAddress(network: string);
}