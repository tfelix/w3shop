import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { ShopError } from "../shop-error";

export interface SmartContractDetails {
  chainId: number;
  contractAddress: string;
}

@Injectable({
  providedIn: 'root'
})
export class ShopIdentifierService {

  private readonly identifier = new BehaviorSubject<string | null>(null);
  readonly identifier$: Observable<string | null> = this.identifier.asObservable();

  setIdentifier(identifier: string) {
    this.identifier.next(identifier);
  }

  buildSmartContractIdentifier(contractAddress: string, chainId: number): string {
    if (contractAddress.startsWith('0x')) {
      // Remove the 0x as this can easily be regenerated.
      contractAddress = contractAddress.slice(2);
    }

    // Currently we only support
    // Type is 1 byte (01), Chain ID is 5 Bytes (0x00066EEB).
    // we use 6 bytes in total so there is no filler character (=) in the resulting hex string.
    const buffer = Buffer.from([0x01, 0x00, 0x00, 0x06, 0x6E, 0xEB]);

    return buffer.toString('base64') + contractAddress;
  }

  isSmartContractIdentifier(identifier: string): boolean {
    try {
      const prefix = identifier.slice(0, 8);
      const buffer = Buffer.from(prefix, 'base64');

      return buffer[0] === 0x01;
    } catch (e) {
      console.log('Error while decoding the identifier: ' + identifier, e);
      return false;
    }
  }

  getSmartContractDetails(identifier: string): SmartContractDetails {
    const prefix = identifier.slice(0, 8);
    const address = identifier.slice(8);
    const buffer = Buffer.from(prefix, 'base64');

    // FIXME We need to make this better
    const isSmartConctract = buffer[0] === 0x01;
    const isArbitrumChain = buffer[1] == 0x00 && buffer[2] == 0x00 && buffer[5] == 0xEB;

    if (!isSmartConctract || !isArbitrumChain) {
      throw new ShopError('Shop identifier is not a Smart Contract identifier');
    }

    return {
      chainId: 421611, // Arbitrum Rinkeby
      contractAddress: '0x' + address
    }
  }
}