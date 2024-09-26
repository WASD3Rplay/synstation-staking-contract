import { DeployFunction } from 'hardhat-deploy/types';
const func: DeployFunction = async ({ getNamedAccounts, deployments: { deploy, getOrNull }, ethers, network }) => {
  const { deployer } = await getNamedAccounts();
  await deploy('deNFT', {
    from: deployer,
    log: true,
    contract: 'contracts/DepositNFT.sol:DepositNFT',
    args: [],
    proxy: {
      proxyContract: 'OpenZeppelinTransparentProxy',
      execute: {
        init: {
          methodName: 'initialize',
          args: [],
        },
      },
    },
  });
};

export default func;

export const tags = ['deNFT'];
