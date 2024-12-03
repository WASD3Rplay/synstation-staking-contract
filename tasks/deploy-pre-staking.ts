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
const rstETH = '0x7a4EffD87C2f3C55CA251080b1343b605f327E3a'; // mellow
const weETH = '0xCd5fE23C85820F7B72D0926FC9b05b43E359b7ee'; // wrapped eEth
const usdt = '0xdac17f958d2ee523a2206206994597c13d831ec7';
const usdc = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const wbtc = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599';
const wastr = '0xaeaaf0e2c81af264101b9129c00f4440ccf0f720';
const nastr = '0xE511ED88575C57767BAfb72BfD10775413E3F2b0';
const aastr = '0xC7E92Cf2c4f5bA60E926D3dB25ad9aBfA063aBd9';
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

task('update-pool', 'Add Pool')
  .addParam('pid', 'pool id')
  .addParam('token', 'new token address')
  .setAction(async (taskArgs, hre) => {
    const {
      ethers,
      getNamedAccounts,
      deployments: { deploy, get },
    } = hre;

    const { token, pid } = taskArgs;

    const { deployer } = await getNamedAccounts();
    console.log('deployer', deployer);
    const PreStaking = (await hre.ethers.getContract('PreStaking', deployer)) as SynstationPreStaking;

    const tx = await PreStaking.updatePool(pid, token);

    await tx.wait();
  });
