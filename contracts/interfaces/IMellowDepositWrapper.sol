// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

interface IMellowDepositWrapper {
    function deposit(address to, address token, uint256 amount, uint256 minLpAmount, uint256 deadline)
        external
        payable
        returns (uint256 lpAmount);
}
