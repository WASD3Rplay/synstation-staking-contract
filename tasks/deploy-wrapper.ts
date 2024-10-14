import { task, types } from 'hardhat/config';
import { SynstationPreStaking } from '../typechain-types';
const wstETH = '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0';
const stETH = '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84';
task('deploy-wst-wrapper', 'Deploy wstWrapper')
  .addParam('pid', 'pid')
  .setAction(async (taskArgs, hre) => {
    const {
      ethers,
      getNamedAccounts,
      deployments: { deploy, get },
    } = hre;

    const { pid } = taskArgs;

    const { deployer } = await getNamedAccounts();

    const preStaking = await hre.deployments.get('PreStaking');

    await deploy('WstETHWrapper', {
      from: deployer,
      log: true,
      contract: 'WstETHWrapper',
      args: [preStaking.address, pid, wstETH, stETH, wstETH],
    });
  });
