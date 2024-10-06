// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

interface IDepositNFT {
    function safeMint(address to, address token, uint256 amount, address wrappedToken, uint256 wrappedAmount)
        external;
    function getTokenIds(address user) external view returns (uint256[] memory);
    function getDepositInfo(uint256 tokenId)
        external
        view
        returns (address depositToken, uint256 amount, address wrappedToken, uint256 wrappedAmount);
}
