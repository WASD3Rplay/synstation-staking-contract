import { task, types } from 'hardhat/config';
import { Staking } from '../typechain-types';
import { ZeroAddress } from 'ethers';

task('deploy-legacy', 'upgrade Deploy legacy Staking').setAction(async (taskArgs, hre) => {
  const {
    ethers,
    getNamedAccounts,
    deployments: { deploy, get },
  } = hre;

  const { deployer } = await getNamedAccounts();

  await deploy('Staking', {
    from: deployer,
    log: true,
    contract: 'contracts/Staking.sol:Staking',
    args: [],
    proxy: {
      proxyContract: 'OpenZeppelinTransparentProxy',
    },
  });
});

task('set-migrator', 'upgrade Deploy legacy Staking').setAction(async (taskArgs, hre) => {
  const {
    ethers,
    getNamedAccounts,
    deployments: { deploy, get },
  } = hre;

  const { deployer } = await getNamedAccounts();

  const staking = (await hre.ethers.getContract('Staking', deployer)) as Staking;

  const preStaking = await hre.deployments.get('PreStaking');

  const tx = await staking.setMigrationInfo(deployer, preStaking.address);
});

const migrationData = {
  eth: [
    '0xbDc61836abdf0542Fe4A0B8bf30Eaed77953684b',
    '0xFDefc04Ed449Bf48F59618E84d4cA118162cd5a3',
    '0x8C2755Cdcf38086d3001c39d5A1b876e9AD9bc75',
    '0xC9C9eC05cEBc9632C8b3dF7Ff1205370C7AafbeF',
    '0xA083345EB51A1Eaa908770ACEC8b005279637114',
    '0x1388008810B3458a9aFAB46a678b1ed3992fCc70',
    '0xF531b8515B275f15Fc0Cc4f14a5FCb71FF9Cf262',
    '0xB5a6cfDFF33d890aB5e2bda4f9dbb6198DfA208e',
    '0xEEA45C31B0131C41b7c8DC5A4A93FeAe475a80cA',
    '0x4B207c3Fc4FfC9f88C922aF3FD2a7D655D06b7EA',
    '0x6aC69296DE99236dA854603CB3EbFB84c28AF55c',
  ],
  usdc: ['0x8377Fd48c0519c92CB10dbE678C5f5087151968D'],
  stETH: ['0xbDc61836abdf0542Fe4A0B8bf30Eaed77953684b'],
};

task('migrate-info', 'upgrade Deploy legacy Staking').setAction(async (taskArgs, hre) => {
  const {
    ethers,
    getNamedAccounts,
    deployments: { deploy, get },
  } = hre;

  const { deployer } = await getNamedAccounts();

  console.log;

  const staking = (await hre.ethers.getContract('Staking', deployer)) as Staking;

  const preStaking = await hre.deployments.get('PreStaking');
  const wst = '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0';
  const st = '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84';
  const dc = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'; // pid 4
  const tx = await staking.migrateData(ZeroAddress, wst, 0, migrationData.eth);
  // const tx = await staking.migrateData(st, wst, 0, migrationData.stETH);
  // const tx = await staking.migrateData(dc, dc, 4, migrationData.usdc);
});
