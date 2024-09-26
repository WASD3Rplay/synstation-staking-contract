import { task, types } from 'hardhat/config';
import { addressBook } from '../config/token';

task('set-lido', 'Set lido').setAction(async (taskArgs, hre) => {
  const {
    ethers,
    getNamedAccounts,
    deployments: { deploy, get },
  } = hre;

  const { stETH, wstETH } = addressBook[hre.network.name];

  const { deployer } = await getNamedAccounts();

  const depositContract = await ethers.getContractAt('Staking', (await get('Staking')).address);

  const setLido = await depositContract.setLido(stETH, wstETH, true);
  await setLido.wait();
});
