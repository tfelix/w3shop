import { ethers } from "ethers";
import { W3ShopBytecode } from "./w3shop.bytecode";

function encode(types: string[], values: any[]) {
  const abiCoder = ethers.utils.defaultAbiCoder;
  const encodedParams = abiCoder.encode(types, values);
  return encodedParams.slice(2);
}

export function generateShopAddress(
  factoryAddress: string,
  ownerAddress: string,
  paymentProcessorAddress: string,
  shopItemsAddress: string,
  salt: string
): string {
  const bytecode = W3ShopBytecode;

  const initCode = bytecode + encode(
    [
      "address",
      "address",
    ],
    [
      paymentProcessorAddress,
      shopItemsAddress,
    ]
  );
  const initCodeHash = ethers.utils.keccak256(initCode);

  // TODO the initCodeHash is always the same, we can just save it permanently and dont
  console.log('InitCodeHash: ' + initCodeHash);

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