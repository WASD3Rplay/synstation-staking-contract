// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IWETH} from "../interfaces/IWETH.sol";
import {SynstationDepositWrapper} from "./SynstationDepositWrapper.sol";
contract WAstarWrapper is SynstationDepositWrapper {
    using SafeERC20 for IERC20;

    IWETH public WETH;

    constructor(
        address _preStaking,
        uint256 _pid,
        IERC20 _want,
        IWETH _WETH
    ) SynstationDepositWrapper(_preStaking, _pid, _want) {
        WETH = _WETH;
    }

    function _handleWrapProcess(
        address _token,
        uint256 _amount
    ) internal override {
        require(_token == address(0), "!invalid-token");

        if (_token == address(0)) {
            require(msg.value == _amount, "!value-mismatch");

            WETH.deposit{value: _amount}();
        }
    }

    function previewDeposit(
        address _token,
        uint256 _amount
    ) external view override returns (uint256) {
        _token;

        return _amount;
    }
}
