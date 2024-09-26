import { task, types } from 'hardhat/config';

task('add-deposit-token', 'Setup addresses for contracts')
  .addParam('token', 'new token address')
  .setAction(async (taskArgs, hre) => {
    const {
      ethers,
      getNamedAccounts,
      deployments: { deploy, get },
    } = hre;
    const { token } = taskArgs;
    const { deployer } = await getNamedAccounts();

    const depositContract = await ethers.getContractAt('Staking', (await get('Staking')).address);

    const depositAllowed = await depositContract.depositAllowed(token);

    if (depositAllowed) {
      console.log('Token already allowed');
      return;
    }
    console.log('Setting token to allowed', token);
    const tx = await depositContract.setDepositAllowed(token, true);

    await tx.wait();
  });
