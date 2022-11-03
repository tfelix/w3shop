import { ethers } from 'hardhat';

// deterministically computes the smart contract address given
// the account the will deploy the contract (factory contract)
// the salt as uint256 and the contract bytecode
function buildCreate2Address(
  creatorAddress: string,
  salt: string,
  byteCode: string
) {
  const tempStr = [
    'ff',
    creatorAddress,
    ethers.utils.formatBytes32String(salt),
    ethers.utils.keccak256(byteCode),
  ]
    .map((x) => x.replace(/0x/, ''))
    .join('');

  return `0x${ethers.utils.keccak256(`0x${tempStr}`).slice(-40)}`.toLowerCase();
}

// encodes parameter to pass as contract argument
function encodeParam(types: string[], data: any[]) {
  return ethers.utils.defaultAbiCoder.encode(types, data);
}

export async function buildExpectedShopAddress(
  factoryAddress: string,
  paymentProcessorAddress: string,
  shopItemsAddress: string,
  shopConfigParam: string,
  salt: string
): Promise<string> {
  // Calculate addresse before and compare later.
  const constructorTypes = ['address', 'address', 'string'];
  const constructorArgs = [paymentProcessorAddress, shopItemsAddress, shopConfigParam];

  const W3Shop = await ethers.getContractFactory('W3Shop');
  const w3ShopBytecode = W3Shop.bytecode;

  // constructor arguments are appended to contract bytecode
  const bytecode = `${w3ShopBytecode}${encodeParam(
    constructorTypes,
    constructorArgs
  ).slice(2)}`;

  return buildCreate2Address(
    factoryAddress,
    salt,
    bytecode
  );
}