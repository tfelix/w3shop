import { W3ShopFactory } from '../typechain';
import { expect } from 'chai';
import { ethers, deployments, getNamedAccounts } from 'hardhat';

export function saltToHex(salt: string | number): string {
  return ethers.utils.id(salt.toString());
}

export function encodeParams(dataTypes: any[], data: any[]) {
  const abiCoder = ethers.utils.defaultAbiCoder;
  return abiCoder.encode(dataTypes, data);
}

export function buildBytecode(
  constructorTypes: any[],
  constructorArgs: any[],
  contractBytecode: string
): string {
  const params = encodeParams(constructorTypes, constructorArgs).slice(2);

  return `${contractBytecode}${params}`;
}

export function buildCreate2Address(saltHex: string, byteCode: string) {
  const factoryAddress = '0x4a27c059FD7E383854Ea7DE6Be9c390a795f6eE3';

  const keccak256 = ethers.utils.keccak256;
  return `0x${keccak256(
    `0x${['ff', factoryAddress, saltHex, ethers.utils.keccak256(byteCode)]
      .map((x) => x.replace(/0x/, ''))
      .join('')}`
  ).slice(-40)}`.toLowerCase();
}

/**
 * Calculate create2 address of a contract.
 *
 * Calculates deterministic create2 address locally.
 *
 */
export function getCreate2Address(
  salt: string | number,
  contractBytecode: string,
  constructorTypes = [] as string[],
  constructorArgs = [] as any[]
) {
  return buildCreate2Address(
    saltToHex(salt),
    buildBytecode(constructorTypes, constructorArgs, contractBytecode)
  );
}

describe('W3ShopFactory', function () {
  let sut: W3ShopFactory;

  this.beforeAll(async function () {
    await deployments.fixture(['W3ShopFactory']);
    sut = await ethers.getContract('W3ShopFactory');
  });

  describe('when createShop is called', async function () {
    it('creates deterministic addresses', async function () {
      const { shopOwner } = await getNamedAccounts();

      // Calculate addresse before and compare later.
      const constructorTypes = ['address', 'string', 'string'];
      const constructorArgs = [shopOwner, 'ar:ABCDEFG', 'ar:ABCDEFG'];
      const initCodeHash = buildBytecode(
        constructorTypes,
        constructorArgs,
        'bytecode'
      );
      const salt = ethers.utils.formatBytes32String('33334444');
      const expectedAddr = ethers.utils.getCreate2Address(shopOwner, salt, initCodeHash);

      const shop = await sut.createShop(
        shopOwner,
        'ar:ABCDEFG',
        'ar:ABCDEFG',
        salt
      );
      console.log(shop);
    });

    it('emits an event', async function () {
      const salt = ethers.utils.formatBytes32String('11112222');
      const { shopOwner } = await getNamedAccounts();

      await expect(sut.createShop(shopOwner, 'ar:ABCDEFG', 'ar:ABCDEFG', salt))
        .to.emit(sut, 'Created')
        .withArgs(shopOwner, '0x0471d411Acc9FeaF343A0c182CdDd388C06B0BFc');
    });
  });
});
