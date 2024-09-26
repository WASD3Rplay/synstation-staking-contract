// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockStETH is ERC20 {
    constructor() ERC20("stETH", "stETH") {}

    function submit(address user) external payable returns (uint256 stETHAmount) {
        _mint(msg.sender, msg.value);

        return msg.value;
    }
}
