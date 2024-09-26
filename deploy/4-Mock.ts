import { DeployFunction } from 'hardhat-deploy/types';
import { addressBook } from '../config/token';
const func: DeployFunction = async ({ getNamedAccounts, deployments: { deploy, getOrNull }, ethers, network }) => {
  if (network.name === 'mainnet' || network.name === 'sepolia' || network.name === 'holesky') {
    console.log('Deploying to mainnet is not allowed');
    return;
  }
  const { deployer } = await getNamedAccounts();

  if (!addressBook[network.name]?.stETH) {
    await deploy('MockStETH', {
      from: deployer,
      log: true,
      contract: 'contracts/mock/MockStETH.sol:MockStETH',
      args: [],
    });
  }
  if (!addressBook[network.name]?.wstETH) {
    await deploy('MockWstETH', {
      from: deployer,
      log: true,
      contract: 'contracts/mock/MockWstETH.sol:MockWstETH',
      args: [],
    });
  }
};

export default func;

export const tags = ['Mock'];
