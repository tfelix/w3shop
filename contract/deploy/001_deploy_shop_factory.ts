import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre as any;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  await deploy('W3ShopFactory', {
    contract: 'W3ShopFactory',
    from: deployer,
    log: true
  });
};
export default func;
func.tags = ['W3ShopFactory', 'full'];
