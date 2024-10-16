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
          args: [deployer],
        },
      },
    },
  });
});
const wstETH = '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0';
const karakUSDT = '0xA92b60b8eFE9ac06ED65980A6d43e3f488a7f7bb';
const rstETH = '0x7a4EffD87C2f3C55CA251080b1343b605f327E3a'; // mellow
const weETH = '0xCd5fE23C85820F7B72D0926FC9b05b43E359b7ee'; // wrapped eEth
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
    console.log('deployer', deployer);
    const PreStaking = (await hre.ethers.getContract('PreStaking', deployer)) as SynstationPreStaking;

    const tx = await PreStaking.add(token, '0');

    await tx.wait();
  });
