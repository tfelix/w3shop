import { ethers } from "ethers";
import { environment } from "src/environments/environment";


export function generateShopAddress(
  factoryAddress: string,
  ownerAddress: string,
  salt: string
): string {
  const initCodeHash = environment.initCodeHashW3Shop;

  const saltHashed = ethers.utils.solidityKeccak256(
    ['address', 'bytes32'],
    [ownerAddress, salt]
  );

  const computedAddr = ethers.utils.getCreate2Address(
    factoryAddress,
    saltHashed,
    initCodeHash
  );

  return computedAddr;
}