import { time, loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs';
import { expect, should } from 'chai';
import hre, { deployments, ethers } from 'hardhat';
import { Contract, parseEther, ZeroAddress } from 'ethers';
import { DepositNFT, MockStETH, MockWstETH, OGNFT, Staking } from '../typechain-types';
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';

interface Deployment {
  depositContract: Staking;
  deNFT: DepositNFT;
  ogNFT: OGNFT;
  stETH: MockStETH;
  wstETH: MockWstETH;
}
describe('Deposit', function () {
  let deployment: Deployment;
  let admin: HardhatEthersSigner;

  const deployFixture = deployments.createFixture(async ({ deployments, ethers, companionNetworks }, options) => {
    await deployments.fixture(undefined, {
      keepExistingDeployments: true,
    });

    const [deployer] = await ethers.getSigners();
    admin = deployer;
    console.log('Deployer address:', deployer.address);

    const DepositContractDeployment = await deployments.get('Staking');
    const depositContract = await hre.ethers.getContractAt('Staking', DepositContractDeployment.address);

    const DepositNFTDeployment = await deployments.get('deNFT');
    const deNFT = await ethers.getContractAt('DepositNFT', DepositNFTDeployment.address);

    const OGNFTDeployment = await deployments.get('ogNFT');
    const ogNFT = await ethers.getContractAt('OGNFT', OGNFTDeployment.address);

    const stETHDeployment = await deployments.get('MockStETH');
    const stETH = await ethers.getContractAt('MockStETH', stETHDeployment.address);

    const wstETHDeployment = await deployments.get('MockWstETH');
    const wstETH = await ethers.getContractAt('MockWstETH', wstETHDeployment.address);

    return {
      depositContract,
      deNFT,
      ogNFT,
      stETH,
      wstETH,
    };
  });

  beforeEach(async function () {
    deployment = await deployFixture();

    await deployment.depositContract.setDepositNFT(await deployment.deNFT.getAddress());
    await deployment.depositContract.setOGNFT(await deployment.ogNFT.getAddress());

    await deployment.deNFT.setDepositContract(await deployment.depositContract.getAddress());
    await deployment.ogNFT.setDepositContract(await deployment.depositContract.getAddress());

    // mock
    await deployment.wstETH.setStETH(await deployment.stETH.getAddress());
    await deployment.depositContract.setLido(await deployment.stETH.getAddress(), await deployment.wstETH.getAddress(), true);
  });

  describe('Deployment', function () {
    it('should set right contract address', async function () {
      expect(await deployment.depositContract.depositNFT()).to.be.equal(await deployment.deNFT.getAddress());
      expect(await deployment.depositContract.ogNFT()).to.be.equal(await deployment.ogNFT.getAddress());

      expect(await deployment.deNFT.depositContract()).to.be.equal(await deployment.depositContract.getAddress());
      expect(await deployment.ogNFT.depositContract()).to.be.equal(await deployment.depositContract.getAddress());
    });

    it('should set the right mock token addresses', async function () {
      expect(await deployment.wstETH.stETH()).to.be.equal(await deployment.stETH.getAddress());

      expect(await deployment.depositContract.STETH()).to.be.equal(await deployment.stETH.getAddress());
      expect(await deployment.depositContract.WSTETH()).to.be.equal(await deployment.wstETH.getAddress());
    });
  });

  describe('Mock', function () {
    it('should mint stETH if submit function is called with msg.value', async function () {
      const value = parseEther('1');

      await deployment.stETH.submit(ZeroAddress, {
        value: value,
      });

      expect(await deployment.stETH.balanceOf(await admin.getAddress())).to.be.equal(value);
    });

    it('should get appropriate wstETH amount according to exchange rate when wrap function is called', async function () {
      await deployment.wstETH.setStETH(await deployment.stETH.getAddress());

      const value = parseEther('1');

      await deployment.stETH.submit(ZeroAddress, {
        value: value,
      });

      await deployment.stETH.approve(await deployment.wstETH.getAddress(), value);

      const exchangeRate = await deployment.wstETH.exchangeRate();

      const amountToReceive = (value * 10000n) / exchangeRate;

      await deployment.wstETH.wrap(value);

      expect(await deployment.wstETH.balanceOf(await admin.getAddress())).to.be.equal(amountToReceive);
    });

    it('should get unwrapped amount according to exchange rate when unwrap function is called', async function () {
      await deployment.wstETH.setStETH(await deployment.stETH.getAddress());

      const value = parseEther('1');

      await deployment.stETH.submit(ZeroAddress, {
        value: value,
      });

      await deployment.stETH.approve(await deployment.wstETH.getAddress(), value);

      const exchangeRate = await deployment.wstETH.exchangeRate();

      const amountToReceive = (value * 10000n) / exchangeRate;

      await deployment.wstETH.wrap(value);

      await deployment.wstETH.setExchangeRate(10400n);

      await deployment.wstETH.unwrap(amountToReceive / 2n);

      const amountToReceiveAfterExchangeRateIncreased = ((amountToReceive / 2n) * 10400n) / 10000n;

      expect(await deployment.stETH.balanceOf(await admin.getAddress())).to.be.equal(amountToReceiveAfterExchangeRateIncreased);
    });
  });

  describe('Deposit', function () {
    it('should revert when paused', async function () {
      expect(
        deployment.depositContract.deposit(ZeroAddress, parseEther('1'), {
          value: parseEther('1'),
        })
      ).to.be.revertedWith('Pausable: paused');
    });

    it('should revert when depositNFT is not set', async function () {
      await deployment.depositContract.unpause();
      await deployment.depositContract.setDepositNFT(ZeroAddress);
      expect(
        deployment.depositContract.deposit(ZeroAddress, parseEther('1'), {
          value: parseEther('1'),
        })
      ).to.be.revertedWithCustomError(deployment.depositContract, 'DepositNFTNotSet');
    });

    it('shoud revert when depositing ETH but value is not equal to msg.value', async function () {
      await deployment.depositContract.unpause();
      expect(
        deployment.depositContract.deposit(ZeroAddress, parseEther('1'), {
          value: parseEther('2'),
        })
      ).to.be.revertedWithCustomError(deployment.depositContract, 'InvalidAmount');
    });

    it('shoud revert when depositing ETH but value is 0', async function () {
      await deployment.depositContract.unpause();
      expect(deployment.depositContract.deposit(ZeroAddress, parseEther('1'))).to.be.revertedWithCustomError(
        deployment.depositContract,
        'ZeroDeposit'
      );
    });

    it('shoud revert when depositing stETH but value is greater than 0', async function () {
      await deployment.depositContract.unpause();

      const value = parseEther('1');

      await deployment.stETH.submit(ZeroAddress, {
        value: value,
      });

      await deployment.stETH.approve(await deployment.depositContract.getAddress(), value);

      expect(
        deployment.depositContract.deposit(await deployment.stETH.getAddress(), value, {
          value: value,
        })
      ).to.be.revertedWithCustomError(deployment.depositContract, 'ValueNotAccepted');
    });

    describe('deNFT', function () {
      it('should get deNFT when depositing Ether', async function () {
        await deployment.depositContract.unpause();

        const value = parseEther('1');

        await deployment.depositContract.deposit(ZeroAddress, value, {
          value: value,
        });

        const tokenId = await deployment.deNFT.tokenOfOwnerByIndex(await admin.getAddress(), 0);
        const balance = await deployment.deNFT.balanceOf(await admin.getAddress());
        expect(balance).to.be.equal(1);
        expect(await deployment.deNFT.ownerOf(tokenId)).to.be.equal(await admin.getAddress());
      });
      it('should get deNFT when depositing stETH', async function () {
        await deployment.depositContract.unpause();

        const value = parseEther('1');

        await deployment.stETH.submit(ZeroAddress, {
          value: value,
        });

        await deployment.stETH.approve(await deployment.depositContract.getAddress(), value);

        await deployment.depositContract.deposit(await deployment.stETH.getAddress(), value);

        const tokenId = await deployment.deNFT.tokenOfOwnerByIndex(await admin.getAddress(), 0);
        const balance = await deployment.deNFT.balanceOf(await admin.getAddress());

        expect(balance).to.be.equal(1);
        expect(await deployment.deNFT.ownerOf(tokenId)).to.be.equal(await admin.getAddress());
      });
      it('should get deNFT when depositing ERC20', async function () {
        await deployment.depositContract.unpause();
      });
      it('should revert trying tranfser deNFT when paused', async function () {
        await deployment.depositContract.unpause();

        const value = parseEther('1');

        await deployment.depositContract.deposit(ZeroAddress, value, {
          value: value,
        });

        const tokenId = await deployment.deNFT.tokenOfOwnerByIndex(await admin.getAddress(), 0);
        expect(
          deployment.deNFT.transferFrom(await admin.getAddress(), await deployment.depositContract.getAddress(), tokenId)
        ).to.be.revertedWithCustomError(deployment.deNFT, 'EOATransferPaused');

        await deployment.deNFT.unpause();
      });
    });

    describe('ogNFT', function () {
      it('should get ogNFT when depositing more than 10 Ether ', async function () {
        await deployment.depositContract.unpause();

        const value = parseEther('10');

        expect(await deployment.ogNFT.isMinted(await admin.getAddress())).to.be.equal(false);

        await deployment.depositContract.deposit(ZeroAddress, value, {
          value: value,
        });

        const tokenId = await deployment.ogNFT.tokenOfOwnerByIndex(await admin.getAddress(), 0);
        const balance = await deployment.ogNFT.balanceOf(await admin.getAddress());

        expect(balance).to.be.equal(1);
        expect(await deployment.ogNFT.ownerOf(tokenId)).to.be.equal(await admin.getAddress());

        expect(await deployment.ogNFT.isMinted(await admin.getAddress())).to.be.equal(true);
      });

      it('should not get ogNFT when depositing less than 10 Ether ', async function () {
        await deployment.depositContract.unpause();

        const value = parseEther('9.99');

        await deployment.depositContract.deposit(ZeroAddress, value, {
          value: value,
        });

        const balance = await deployment.ogNFT.balanceOf(await admin.getAddress());

        expect(balance).to.be.equal(0);
      });
      it('should not get multiple ogNFT when depositing more than 10 Ether ', async function () {
        await deployment.depositContract.unpause();

        const value = parseEther('10');

        expect(await deployment.ogNFT.ogMintAvailable(await admin.getAddress(), value)).to.be.equal(true);
        expect(await deployment.ogNFT.isMinted(await admin.getAddress())).to.be.equal(false);
        expect(await deployment.ogNFT.mintAvailable()).to.be.equal(100);

        await deployment.depositContract.deposit(ZeroAddress, value, {
          value: value,
        });

        const tokenId = await deployment.ogNFT.tokenOfOwnerByIndex(await admin.getAddress(), 0);
        const balance = await deployment.ogNFT.balanceOf(await admin.getAddress());

        expect(balance).to.be.equal(1);
        expect(await deployment.ogNFT.ownerOf(tokenId)).to.be.equal(await admin.getAddress());

        expect(await deployment.ogNFT.isMinted(await admin.getAddress())).to.be.equal(true);
        expect(await deployment.ogNFT.ogMintAvailable(await admin.getAddress(), value)).to.be.equal(false);
        expect(await deployment.ogNFT.mintAvailable()).to.be.equal(99);

        await deployment.depositContract.deposit(ZeroAddress, value, {
          value: value,
        });

        const balanceAfterSecondDeposit = await deployment.ogNFT.balanceOf(await admin.getAddress());

        expect(balanceAfterSecondDeposit).to.be.equal(1);
      });
    });
  });
});
