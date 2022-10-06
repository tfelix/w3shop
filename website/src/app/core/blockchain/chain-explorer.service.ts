import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: 'root'
})
export class ChainExplorerService {

  getAddressUrl(address: string): string {
    if (environment.production) {
      return 'https://arbiscan.io/address/' + address;
    } else {
      return 'https://goerli-rollup-explorer.arbitrum.io/address/' + address;
    }
  }
}