import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { NetworkService } from "../blockchain/network.service";
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

  constructor(
    private readonly networkService: NetworkService
  ) { }

  setIdentifier(identifier: string) {
    console.debug('Setting shop identifier to: ' + identifier);
    this.identifier.next(identifier);
  }

  /**
   * Builds a encoded identifier for the shop.
   *
   * Identifier: Type(1 byte), Chain ID(5 bytes), Data(bytes depend on type)
   *
   * @param contractAddress A contract address prefixed with 0x.
   * @returns The encoded identifier that contains chain id and contract address.
   */
  buildSmartContractIdentifier(contractAddress: string): string {
    if (contractAddress.startsWith('0x')) {
      // Remove the 0x as this can easily be regenerated later
      contractAddress = contractAddress.slice(2);
    }

    const network = this.networkService.getExpectedNetwork();


    // Currently we only support
    // Type is 1 byte (01), LengthChainID 1 byte, Chain ID is as long as in LengthChainID.
    // we use 6 bytes in total so there is no filler character (=) in the resulting hex string.
    const typeBuffer = Buffer.from([0x01]);

    const chainIdHex = network.chainId.toString(16);
    const chainIdBuffer = Buffer.from(chainIdHex, 'hex');

    const t = chainIdBuffer.toString('hex');

    const contractAddrBuffer = Buffer.from(contractAddress, 'hex');

    const identBuffer = Buffer.alloc(1 + 1 + chainIdBuffer.length + contractAddrBuffer.length);

    typeBuffer.copy(identBuffer, 0, 0, 1);
    identBuffer.writeUint8(chainIdBuffer.length, 1);
    const written = chainIdBuffer.copy(identBuffer, 2);
    contractAddrBuffer.copy(identBuffer, 2 + written);

    return identBuffer.toString('base64');
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

  /**
   * Currently only supports Smart Contract identifiers
   * @param identifier
   * @returns
   */
  getSmartContractDetails(identifier: string): SmartContractDetails {
    const buffer = Buffer.from(identifier, 'base64');

    const type = buffer.slice(0, 1).readUInt8();
    const chainIdLength = buffer.slice(1, 2).readUint8();
    const chainIdStr = buffer.slice(2, 2 + chainIdLength).toString('hex');
    const chainId = parseInt(chainIdStr);

    const network = this.networkService.getExpectedNetwork();
    const isSmartContract = type === 0x01;
    const isValidChain = chainId === network.chainId;

    if (!isSmartContract) {
      throw new ShopError('Shop identifier is not a Smart Contract');
    }

    if (!isValidChain) {
      throw new ShopError(`Shop identifier chain id ${chainId} is not supported`);
    }

    const address = buffer.slice(2 + chainIdLength).toString('hex');

    return {
      chainId: chainId,
      contractAddress: '0x' + address
    }
  }
}