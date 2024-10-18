// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import {IWstETH} from "../interfaces/IWstETH.sol";
import {ILido} from "../interfaces/ILido.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {SynstationDepositWrapper} from "./SynstationDepositWrapper.sol";
contract WstETHWrapper is SynstationDepositWrapper {
    using SafeERC20 for IERC20;

    ILido public STETH;
    IWstETH public WSTETH;

    constructor(
        address _preStaking,
        uint256 _pid,
        IERC20 _want,
        ILido _STETH,
        IWstETH _WSTETH
    ) SynstationDepositWrapper(_preStaking, _pid, _want) {
        STETH = _STETH;
        WSTETH = _WSTETH;

        IERC20(address(STETH)).safeApprove(address(WSTETH), type(uint256).max);
    }

    function _handleWrapProcess(
        address _token,
        uint256 _amount
    ) internal override {
        require(
            _token == address(0) || _token == address(STETH),
            "!invalid-token"
        );

        if (_token == address(0)) {
            require(msg.value == _amount, "!value-mismatch");

            _ethToStEth(_amount);
            _stEthToWstEth(_amount);
        }

        if (_token == address(STETH)) {
            require(msg.value == 0, "!value-mismatch");

            IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
            _stEthToWstEth(_amount);
        }
    }

    function _ethToStEth(uint256 _amount) internal returns (uint256) {
        return STETH.submit{value: _amount}(address(this));
    }

    function _stEthToWstEth(uint256 _amount) internal returns (uint256) {
        uint256 tokenAmt = WSTETH.wrap(_amount);
        return tokenAmt;
    }

    function previewDeposit(
        address _token,
        uint256 _amount
    ) external view override returns (uint256) {
        if (_token == address(0)) {
            return WSTETH.getWstETHByStETH(_amount);
        }

        if (_token == address(STETH)) {
            return WSTETH.getWstETHByStETH(_amount);
        }

        return 0;
    }
}
