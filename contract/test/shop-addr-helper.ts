import { ethers } from 'hardhat';

/*
function encode(types: string[], values: any[]) {
  const abiCoder = ethers.utils.defaultAbiCoder;
  const encodedParams = abiCoder.encode(types, values);
  return encodedParams.slice(2);
}
*/

export async function buildInitCodeHash(): Promise<string> {
  const W3Shop = await ethers.getContractFactory('W3Shop');
  const bytecode = W3Shop.bytecode;
  /*
  This is actually the real code, but since we have no address arguments for our ctor, we dont need to fill
  those params. It is just kept here as a reminder/helper.
  const encoded = encode(
    [
      "address",
      "address",
    ],
    [
      paymentProcessorAddress,
      shopItemsAddress,
    ]
  );
  const initCode = bytecode + encoded;
  */

  const initCode = bytecode;
  return ethers.utils.keccak256(initCode);
}

export async function buildExpectedShopAddress(
  factoryAddress: string,
  ownerAddress: string,
  salt: string
): Promise<string> {
  const initCodeHash = await buildInitCodeHash();

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