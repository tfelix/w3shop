import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre as any;
  const { deploy } = deployments;

  const { deployer, shopOwner } = await getNamedAccounts();

  const MerkleMultiProof = await deploy('MerkleMultiProof', {
    contract: 'MerkleMultiProof',
    from: deployer,
    log: true,
  });

  const ArweaveUriAppender = await deploy('ArweaveUriAppender', {
    contract: 'ArweaveUriAppender',
    from: deployer,
    log: true,
  });

  await deploy('W3Shop', {
    contract: 'W3Shop',
    from: deployer,
    log: true,
    args: [shopOwner, 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'],
    libraries: {
      MerkleMultiProof: MerkleMultiProof.address,
      ArweaveUriAppender: ArweaveUriAppender.address,
    },
  });
};
export default func;
func.tags = ['W3Shop'];
func.dependencies = ['MerkleMultiProof'];
