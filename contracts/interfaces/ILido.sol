// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";

interface ILido is IERC20 {
    function submit(address user) external payable returns (uint256 stETHAmount);
}
