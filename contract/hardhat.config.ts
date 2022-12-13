import { HardhatUserConfig } from "hardhat/config";
import * as dotenv from "dotenv";
import 'hardhat-deploy';
import "hardhat-gas-reporter";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-chai-matchers";

// Read the .env file
dotenv.config();

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
    arbitrumOne: {
      url: process.env.L2_RPC || '',
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
    apiKey: {
      arbitrumOne: process.env.ETHERSCAN_API_TOKEN !== undefined ? process.env.ETHERSCAN_API_TOKEN : '',
    }
  },
};

export default config;
