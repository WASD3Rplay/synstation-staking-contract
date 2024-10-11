interface AddressBook {
  [network: string]: {
    [token: string]: string;
  };
}

export const addressBook: AddressBook = {
  holesky: {
    stETH: '0x3F1c547b21f65e10480dE3ad8E19fAAC46C95034',
    wstETH: '0x8d09a4502Cc8Cf1547aD300E066060D043f6982D',
  },
  mainnet: {
    stETH: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
    wstETH: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
  },
};
