import { task, types } from 'hardhat/config';
import { SynstationPreStaking } from '../typechain-types';

task('deploy-pre-staking', 'Deploy Pre Staking').setAction(async (taskArgs, hre) => {
  const {
    ethers,
    getNamedAccounts,
    deployments: { deploy, get },
  } = hre;

  const { deployer } = await getNamedAccounts();

  await deploy('PreStaking', {
    from: deployer,
    log: true,
    contract: 'SynstationPreStaking',
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
});
const wstETH = '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0';
task('add-pool', 'Add Pool')
  .addParam('token', 'new token address')
  .setAction(async (taskArgs, hre) => {
    const {
      ethers,
      getNamedAccounts,
      deployments: { deploy, get },
    } = hre;

    const { token } = taskArgs;

    const { deployer } = await getNamedAccounts();

    const PreStaking = (await hre.ethers.getContract('PreStaking', deployer)) as SynstationPreStaking;

    const tx = await PreStaking.add(token, '0');

    await tx.wait();
  });
