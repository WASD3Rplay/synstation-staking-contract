import './tasks';
import '@nomicfoundation/hardhat-toolbox';
import '@nomicfoundation/hardhat-ethers';
import 'hardhat-deploy';
import 'hardhat-deploy-ethers';
import * as dotenv from 'dotenv';
import { ethers } from 'ethers';
dotenv.config();

const DEPLOYER_PVT_KEY = process.env.DEPLOYER_PVT_KEY || '';
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || '';
const config = {
  solidity: {
    compilers: [
      {
        version: '0.8.19',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  networks: {
    //   hardhat: {
    //     forking: {
    //       url: 'https://eth-mainnet.alchemyapi.io/v2/your-api-key',
    //       blockNumber: 13000000,
    //     },
    //     accounts: [
    //       {
    //         privateKey: DEPLOYER_PVT_KEY,
    //         balance: ethers.parseEther('100').toString(),
    //       },
    //     ],
    //   },
    mainnet: {
      chainId: 1,
      url: 'https://eth.llamarpc.com',
      accounts: [DEPLOYER_PVT_KEY],
      verify: {
        etherscan: {
          apiKey: ETHERSCAN_API_KEY,
        },
      },
    },
    sepolia: {
      chainId: 11155111,
      url: 'https://rpc.sepolia.org',
      accounts: [DEPLOYER_PVT_KEY],
      verify: {
        etherscan: {
          apiUrl: 'https://api-sepolia.etherscan.io',
          apiKey: ETHERSCAN_API_KEY,
        },
      },
    },
    holesky: {
      chainId: 17000,
      url: 'https://rpc-holesky.rockx.com',
      accounts: [DEPLOYER_PVT_KEY],
      verify: {
        etherscan: {
          apiUrl: 'https://api-holesky.etherscan.io',
          apiKey: ETHERSCAN_API_KEY,
        },
      },
    },
    klaytn: {
      chainId: 8217,
      url: 'https://klaytn.blockpi.network/v1/rpc/public',
      accounts: [DEPLOYER_PVT_KEY],
    },
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },

  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
};

export default config;
