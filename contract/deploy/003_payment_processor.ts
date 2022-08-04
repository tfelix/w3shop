import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre as any;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  const MerkleMultiProof = await deploy('MerkleMultiProof', {
    contract: 'MerkleMultiProof',
    from: deployer,
    log: true,
  });

  await deploy('PaymentProcessor', {
    contract: 'PaymentProcessor',
    from: deployer,
    log: true,
    args: [
    ],
    libraries: {
      MerkleMultiProof: MerkleMultiProof.address,
    },
  });
};
export default func;
func.tags = ['PaymentProcessor'];
func.dependencies = ['MerkleMultiProof'];
