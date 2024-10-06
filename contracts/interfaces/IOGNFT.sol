// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

interface IOGNFT {
    function safeMint(address to) external;
    function ogMintAvailable(address to, uint256 commitment) external view returns (bool);
}
