import { task, types } from 'hardhat/config';
import { Staking } from '../typechain-types';

task('transfer-ownership', 'Transfers ownership of the staking contract')
  .addParam('owner', 'The address of the new owner')
  .setAction(async (taskArgs, hre) => {
    const { ethers, getNamedAccounts } = hre;
    const { deployer } = await getNamedAccounts();
    const { owner } = taskArgs;
    const signer = await ethers.getSigner(deployer);
    const stakingContract = (await ethers.getContract('Staking', deployer)) as Staking;

    const tx = await stakingContract.connect(signer).transferOwnership(owner);

    await tx.wait();

    console.log(`[Ownership Transfer Requested] New owner: ${owner}`);
  });
