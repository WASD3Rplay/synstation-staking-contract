import { DeployFunction } from 'hardhat-deploy/types';
const func: DeployFunction = async ({ getNamedAccounts, deployments: { deploy, getOrNull }, ethers, network }) => {
  const { deployer } = await getNamedAccounts();
  console.log(deployer);
  await deploy('Staking', {
    from: deployer,
    log: true,
    contract: 'contracts/Staking.sol:Staking',
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

export const tags = ['Staking'];
