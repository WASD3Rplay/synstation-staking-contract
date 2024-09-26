import { task, types } from 'hardhat/config';

task('set-addresses', 'Set addresses for contracts').setAction(async (taskArgs, hre) => {
  const {
    ethers,
    getNamedAccounts,
    deployments: { deploy, get },
  } = hre;

  const { deployer } = await getNamedAccounts();

  const ogNFT = await ethers.getContractAt('OGNFT', (await get('ogNFT')).address);
  const deNFT = await ethers.getContractAt('DepositNFT', (await get('deNFT')).address);
  const depositContract = await ethers.getContractAt('Staking', (await get('Staking')).address);

  console.log('...Set DeNFT to Deposit Contract');
  const deNFTSet = await depositContract.setDepositNFT(await deNFT.getAddress());
  await deNFTSet.wait();

  console.log('...Set OG NFT to Deposit Contract');
  const ogNFTSet = await depositContract.setOGNFT(await ogNFT.getAddress());
  await ogNFTSet.wait();

  console.log('...Set Deposit Contract to DeNFT');
  const deNFTdepositContractSet = await deNFT.setDepositContract(await depositContract.getAddress());
  await deNFTdepositContractSet.wait();

  console.log('...Set Deposit Contract to OG NFT');
  const ogNFTdepositContractSet = await ogNFT.setDepositContract(await depositContract.getAddress());
  await ogNFTdepositContractSet.wait();
});
