import { HardhatUserConfig } from "hardhat/config";
import 'hardhat-deploy';
import "hardhat-gas-reporter";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-chai-matchers";

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.8.17',
        settings: {
          optimizer: {
            enabled: true
          }
        }
      }
    ],
  },
  namedAccounts: {
    deployer: 0,
    shopOwner: 1,
    buyer: 2,
  },
  networks: {
    goerlyArbitrum: {
      url: 'https://goerli-rollup.arbitrum.io/rpc/',
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    arbitrum: {
      url: 'https://arbitrum.io/rpc',
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
  },
  gasReporter: {
    // To enable the gasReporter, depending on the env flag.
    // enabled: (process.env.REPORT_GAS) ? true : false,
    enabled: true,
    currency: 'USD',
    gasPrice: 20,
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
