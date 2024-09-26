import { task, types } from 'hardhat/config';

task('set-deposit-pause', 'Set Pause')
  .addParam('pause', 'pause', true, types.boolean)
  .setAction(async (taskArgs, hre) => {
    const {
      ethers,
      getNamedAccounts,
      deployments: { deploy, get },
    } = hre;

    const { pause } = taskArgs;

    const { deployer } = await getNamedAccounts();

    const depositContract = await ethers.getContractAt('Staking', (await get('Staking')).address);

    const currentPauseStatus = await depositContract.paused();
    if (pause) {
      if (currentPauseStatus) {
        console.log('Already paused');
        return;
      }

      const pauseTx = await depositContract.pause();
      await pauseTx.wait();
    } else {
      if (!currentPauseStatus) {
        console.log('Already unpaused');
        return;
      }

      const unpauseTx = await depositContract.unpause();
      await unpauseTx.wait();
    }
  });
