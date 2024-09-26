import { task, types } from 'hardhat/config';

task('deploy-mock-erc20', 'Set Pause').setAction(async (taskArgs, hre) => {
  const {
    ethers,
    getNamedAccounts,
    deployments: { deploy, get },
  } = hre;

  const { deployer } = await getNamedAccounts();

  const MockERC20 = await ethers.getContractFactory('MockERC20');

  await deploy('MockERC20', {
    from: deployer,
    log: true,
    contract: 'contracts/mock/MockERC20.sol:MockERC20',
    args: [],
  });
});
