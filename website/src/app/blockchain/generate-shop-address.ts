import { ethers, getCreate2Address } from 'ethers';
import { environment } from 'src/environments/environment';


export function generateShopAddress(
  factoryAddress: string,
  ownerAddress: string,
  salt: string
): string {
  const initCodeHash = environment.initCodeHashW3Shop;

  const saltHashed = ethers.solidityPackedKeccak256(
    ['address', 'bytes32'],
    [ownerAddress, salt]
  );

  const computedAddr = getCreate2Address(
    factoryAddress,
    saltHashed,
    initCodeHash
  );

  return computedAddr;
}