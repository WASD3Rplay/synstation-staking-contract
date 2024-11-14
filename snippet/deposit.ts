import { ethers, ZeroAddress } from 'ethers';
// using ethers@6

const DEPOSIT_ABI = [
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'pid',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
    ],
    name: 'deposit',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

const WRAPPER_ABI = [
  {
    inputs: [
      {
        internalType: 'address',
        name: '_token',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: '_amount',
        type: 'uint256',
      },
    ],
    name: 'deposit',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'payable',
    type: 'function',
  },
];

/*
    1. When you deposit using output Token (wstETH, WASTR), use deposit contract

    2. When you deposit using input Token (ETH, ASTR), use wrapper contract

*/

async function depositEthToStaking() {
  const provider = new ethers.JsonRpcProvider('rpc_url'); // TODO: replace rpc_url with your rpc url
  const mainnetWstWrapperAddress = '0x6c87f5C23DdB092930Ed80324b2fafF46b5fb586';

  // TODO: iteration
  const signer = new ethers.Wallet('private_key', provider);
  const wstWrapperContract = new ethers.Contract(mainnetWstWrapperAddress, WRAPPER_ABI, signer);

  const amount = ethers.parseEther('amt'); // TODO: replace amt with the amount you want to deposit

  const tx = await wstWrapperContract.deposit(ZeroAddress, amount, {
    value: amount,
  });
  await tx.wait();
}
