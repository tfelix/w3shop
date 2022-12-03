import { Injectable } from '@angular/core';
import { NetworkService } from '../network.service';
import { ShopError } from '../shop-error';

export interface SmartContractDetails {
  identifier: string;
  contractAddress: string;
  chainId: number;
}

export class ShopIdentifierError extends ShopError {
  constructor(msg: string) {
    super(msg);
  }
}

/**
 * This class is placed in the core module as it is a shared service that is used both from the shop deployment module
 * as well as from the shop lazy module.
 */
@Injectable({
  providedIn: 'root'
})
export class ShopIdentifierService {

  constructor(
    private readonly networkService: NetworkService,
  ) { }

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
    const versionBuffer = Buffer.from([0x01]);
    const chainIdBuffer = Buffer.alloc(4);
    chainIdBuffer.writeUInt32BE(network.chainId);

    const contractAddrBuffer = Buffer.from(contractAddress, 'hex');

    // Type(1byte),ChainId(4byte),contractAddr(?byte)
    const identBuffer = Buffer.alloc(1 + 4 + contractAddrBuffer.length);

    versionBuffer.copy(identBuffer, 0, 0, 1);
    chainIdBuffer.copy(identBuffer, 1);
    contractAddrBuffer.copy(identBuffer, 5);

    const identifier = identBuffer.toString('base64');

    return this.cleanHexStrForUrl(identifier);
  }

  /**
   * Currently only supports Smart Contract identifiers
   * @param identifier
   * @returns
   */
  getSmartContractDetails(identifier: string): SmartContractDetails {
    const cleanedIdentifier = this.regenerateHexStrFromUrl(identifier);
    const buffer = Buffer.from(cleanedIdentifier, 'base64');

    const type = buffer.slice(0, 1).readUInt8();
    const chainId = buffer.slice(1, 5).readUint32BE();

    const network = this.networkService.getExpectedNetwork();
    const isSmartContract = type === 0x01;
    const isValidChain = chainId === network.chainId;

    if (!isSmartContract) {
      throw new ShopIdentifierError(`Shop identifier '${identifier}' has an invalid format`);
    }

    if (!isValidChain) {
      throw new ShopIdentifierError(`Shop identifier with chain id ${chainId} is not supported`);
    }

    const address = '0x' + buffer.slice(5).toString('hex');
    console.log('Decoded Shop address: ' + address);

    return {
      chainId: chainId,
      contractAddress: address,
      identifier: identifier
    };
  }

  private cleanHexStrForUrl(value: string): string {
    // Replace non-url compatible chars with base64 standard chars
    value = value
      .replace(/\+/g, '_')
      .replace(/\//g, '-')
      .replace(/=+$/g, '');

    return value;
  }

  private regenerateHexStrFromUrl(value: string): string {
    // Replace non-url compatible chars with base64 standard chars
    value = value
      .replace(/_/g, '+')
      .replace(/-/g, '/');

    // Pad out with standard base64 required padding characters
    var pad = value.length % 4;
    if (pad) {
      if (pad === 1) {
        throw new ShopIdentifierError(`Could not decode shop identifier '${value}'`);
      }
      value += new Array(5 - pad).join('=');
    }

    return value;
  }
}