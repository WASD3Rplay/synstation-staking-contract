// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor() ERC20("MockERC20", "MockERC20") {
        _mint(msg.sender, 100_000_000 ether);
    }

    function mint(address user, uint256 amount) external {
        _mint(user, amount);
    }
}
