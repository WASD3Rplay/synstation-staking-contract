// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockWstETH is ERC20 {
    uint256 public exchangeRate = 10300; // 1.03 stETH per wstETH
    address public stETH;

    constructor() ERC20("wstETH", "wstETH") {}

    function wrap(uint256 _stETHAmount) external returns (uint256 _wstETHAmount) {
        ERC20(stETH).transferFrom(msg.sender, address(this), _stETHAmount);

        _wstETHAmount = getWstETHAmount(_stETHAmount);
        _mint(msg.sender, _wstETHAmount);
        return _wstETHAmount;
    }

    function unwrap(uint256 _wstETHAmount) external returns (uint256 _stETHAmount) {
        _stETHAmount = getStETHAmount(_wstETHAmount);

        _burn(msg.sender, _wstETHAmount);
        ERC20(stETH).transfer(msg.sender, _stETHAmount);

        return _stETHAmount;
    }

    function setExchangeRate(uint256 _exchangeRate) external {
        exchangeRate = _exchangeRate;
    }

    function setStETH(address _stETH) external {
        stETH = _stETH;
    }

    function getWstETHAmount(uint256 _stETHAmount) public view returns (uint256 _wstETHAmount) {
        return _stETHAmount * 10000 / exchangeRate;
    }

    function getStETHAmount(uint256 _wstETHAmount) public view returns (uint256 _stETHAmount) {
        return _wstETHAmount * exchangeRate / 10000;
    }

    function getStETHByWstETH(uint256 _wstETHAmount) external view returns (uint256) {
        return getStETHAmount(_wstETHAmount);
    }
}
