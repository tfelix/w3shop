import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre as any;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  await deploy('W3PaymentProcessorV1', {
    contract: 'W3PaymentProcessorV1',
    from: deployer,
    log: true,
    args: [
    ]
  });
};
export default func;
func.tags = ['W3PaymentProcessorV1', 'full'];
