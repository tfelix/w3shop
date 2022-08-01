import * as dotenv from 'dotenv';

import { HardhatUserConfig } from 'hardhat/config';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import 'hardhat-gas-reporter';
import 'hardhat-deploy';
import '@nomiclabs/hardhat-ethers';
import 'solidity-coverage';

dotenv.config();

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.8.9',
      },
      {
        version: '0.7.6',
      },
    ],
  },
  namedAccounts: {
    deployer: 0,
    shopOwner: 1,
    buyer: 2,
  },
  networks: {
    rinkebyArbitrum: {
      url: 'https://rinkeby.arbitrum.io/rpc',
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      verify: {
        etherscan: {
          apiUrl: 'https://api-testnet.arbiscan.io',
        },
      },
    },
    arbitrum: {
      url: 'https://arbitrum.io/rpc',
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      verify: {
        etherscan: {
          apiUrl: 'https://api.arbiscan.io',
        },
      },
    },
  },
  gasReporter: {
    // enabled: process.env.REPORT_GAS !== undefined,
    currency: 'USD',
    gasPrice: 20,
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
