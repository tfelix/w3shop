import { ethers } from 'hardhat';

function encode(types: string[], values: any[]) {
  const abiCoder = ethers.utils.defaultAbiCoder;
  const encodedParams = abiCoder.encode(types, values);
  return encodedParams.slice(2);
}

export async function buildExpectedShopAddress(
  factoryAddress: string,
  paymentProcessorAddress: string,
  shopItemsAddress: string,
  shopConfig: string,
  salt: string
): Promise<string> {
  const W3Shop = await ethers.getContractFactory('W3Shop');
  const bytecode = W3Shop.bytecode;

  const initCode = bytecode + encode(
    [
      "address",
      "address",
      "string"
  ],
    [
      paymentProcessorAddress,
      shopItemsAddress,
      shopConfig
    ]
  );
  const initCodeHash = ethers.utils.keccak256(initCode);

  const computedAddr = ethers.utils.getCreate2Address(
    factoryAddress,
    salt,
    initCodeHash
  );

  return computedAddr;
}