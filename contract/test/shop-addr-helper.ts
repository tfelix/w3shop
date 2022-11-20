import { ethers } from 'hardhat';

function encode(types: string[], values: any[]) {
  const abiCoder = ethers.utils.defaultAbiCoder;
  const encodedParams = abiCoder.encode(types, values);
  return encodedParams.slice(2);
}

export async function buildInitCodeHash(
  paymentProcessorAddress: string,
  shopItemsAddress: string
): Promise<string> {
  const W3Shop = await ethers.getContractFactory('W3Shop');
  const bytecode = W3Shop.bytecode;

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
  return ethers.utils.keccak256(initCode);
}

export async function buildExpectedShopAddress(
  factoryAddress: string,
  ownerAddress: string,
  paymentProcessorAddress: string,
  shopItemsAddress: string,
  salt: string
): Promise<string> {
  const initCodeHash = await buildInitCodeHash(paymentProcessorAddress, shopItemsAddress);

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