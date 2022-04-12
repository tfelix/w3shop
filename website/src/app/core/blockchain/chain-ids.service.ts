import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment"

export const ChainIds = {
  ARBITRUM_RINKEBY: 0x66eeb,
  ARBITRUM: 0x42161
}

@Injectable({
  providedIn: 'root'
})
export class ChainIdService {

  expectedChainId(): number {
    if (environment.production) {
      return ChainIds.ARBITRUM;
    } else {
      return ChainIds.ARBITRUM_RINKEBY;
    }
  }


}