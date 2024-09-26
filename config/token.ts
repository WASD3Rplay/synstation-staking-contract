interface AddressBook {
  [network: string]: {
    stETH: string;
    wstETH: string;
  };
}

export const addressBook: AddressBook = {
  sepolia: {
    stETH: '0x3e3FE7dBc6B4C189E7128855dD526361c49b40Af',
    wstETH: '0xB82381A3fBD3FaFA77B3a7bE693342618240067b',
  },
  holesky: {
    stETH: '0x3F1c547b21f65e10480dE3ad8E19fAAC46C95034',
    wstETH: '0x8d09a4502Cc8Cf1547aD300E066060D043f6982D',
  },
  mainnet: {
    stETH: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
    wstETH: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
  },
};
