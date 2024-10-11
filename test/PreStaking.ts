import { time, loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs';
import { expect, should } from 'chai';
import hre, { deployments, ethers } from 'hardhat';
import { Contract, parseEther, ZeroAddress } from 'ethers';
import { DepositNFT, MockStETH, MockWstETH, OGNFT, Staking } from '../typechain-types';
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';

interface Deployment {
  preStaking: Contract;
}
describe('PreStaking', function () {
  let deployment: Deployment;
  let admin: HardhatEthersSigner;

  const deployFixture = deployments.createFixture(async ({ deployments, ethers, companionNetworks }, options) => {
    await deployments.fixture(undefined, {
      keepExistingDeployments: true,
    });

    const [deployer] = await ethers.getSigners();
    admin = deployer;
    console.log('Deployer address:', deployer.address);

    await deployments.deploy('PreStaking', {
      from: deployer.address,
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

    await deployments.deploy('MockUSDT', {
      from: deployer.address,
      log: true,
      contract: 'MockERC20',
      args: [],
    });

    const preStaking = await ethers.getContract('PreStaking');

    return {
      preStaking,
    };
  });

  beforeEach(async function () {
    await deployFixture();
  });

  describe('Auth', function () {
    it('Only Deployer', async function () {
      const [deployer] = await ethers.getSigners();

      const mockERC20 = await ethers.getContract('MockUSDT');
      const preStaking = await ethers.getContract('PreStaking');
      const bal = await mockERC20.balanceOf(deployer.address);
      console.log('Balance:', bal.toString());

      await preStaking.add(await mockERC20.getAddress(), 0);

      const pool1 = await preStaking.poolInfo(0);

      console.log('Pool:', pool1);

      await mockERC20.approve(await preStaking.getAddress(), parseEther('1000'));

      await preStaking.deposit(0, parseEther('1000'), deployer.address);

      const pool2 = await preStaking.poolInfo(0);
      const userInfo = await preStaking.userInfo(0, deployer.address);

      console.log('Pool:', pool2);

      console.log('User:', userInfo);

      await preStaking.withdraw(0, parseEther('500'), deployer.address);

      const pool3 = await preStaking.poolInfo(0);
      const userInfo2 = await preStaking.userInfo(0, deployer.address);

      console.log('Pool:', pool3);

      console.log('User:', userInfo2);
    });
  });
});
