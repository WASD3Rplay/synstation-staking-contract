// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

interface IMellowVault {
    function deposit(address to, uint256[] memory amounts, uint256 minLpAmount, uint256 deadline)
        external
        returns (uint256[] memory actualAmounts, uint256 lpAmount);
}
