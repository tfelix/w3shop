import { Injectable } from "@angular/core";
import { base64UrlDecode, base64UrlEncode } from "src/app/shared";
import { ShopError } from "../shop-error";

interface SmartContractDetails {
  chainId: number;
  contractAddress: string;
}

@Injectable({
  providedIn: 'root'
})
export class ShopIdentifierService {

  private scIdentifierMatcher = /sc:(\d+):(.+)/gi;

  buildSmartContractIdentifier(contractAddress: string, chainId: number): string {
    const identifier = `sc:${chainId}:${contractAddress}`;

    return base64UrlEncode(identifier);
  }

  isSmartContractIdentifier(identifier: string): boolean {
    const decodedIdentifier = base64UrlDecode(identifier);

    return decodedIdentifier.startsWith('sc:');
  }

  getSmartContractDetails(identifier: string): SmartContractDetails {
    const decodedIdentifier = base64UrlDecode(identifier);
    const result = this.scIdentifierMatcher.exec(decodedIdentifier);

    if (!result) {
      throw new ShopError('Shop identifier is not a Smart Contract identifier');
    }

    return {
      chainId: parseInt(result[1]),
      contractAddress: result[2]
    }
  }
}