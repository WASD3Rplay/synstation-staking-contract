// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import {IMellowVault} from "../interfaces/IMellowVault.sol";
import {IWstETH} from "../interfaces/IWstETH.sol";
import {ILido} from "../interfaces/ILido.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {SynstationPreStaking} from "./SynstationPreStaking.sol";

contract SynstationDepositWrapper {
    using SafeERC20 for IERC20;
    // For ETH deposit, Wrap

    ILido public STETH;
    IWstETH public WSTETH;

    address public preStaking;

    uint256 public pid;

    IMellowVault public mellowVault;

    constructor(address _preStaking, uint256 _pid, IMellowVault _mellowVault, ILido _STETH, IWstETH _WSTETH) {
        preStaking = _preStaking;

        pid = _pid;

        mellowVault = _mellowVault;

        STETH = _STETH;
        WSTETH = _WSTETH;

        IERC20(address(STETH)).safeApprove(address(WSTETH), type(uint256).max);
        IERC20(address(WSTETH)).safeApprove(_mellowVault, type(uint256).max);
        IERC20(address(mellowVault)).safeApprove(_preStaking, type(uint256).max);
    }

    function deposit(address _token, uint256 _amount) external payable {
        _handleWrapProcess(_token, _amount);
    }

    function _handleWrapProcess(address _token, uint256 _amount) internal {
        if (_token == address(0)) {
            require(msg.value == _amount, "!value-mismatch");

            _ethToStEth(_amount);
            _stEthToWstEth(_amount);
        }

        if (_token == address(STETH)) {
            IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
            _stEthToWstEth(_amount);
        }

        uint256 lpBal = _wstEthToWant();

        // 1. deposit want balance to pre staking contract
        SynstationPreStaking(preStaking).deposit(pid, lpBal, msg.sender);

        // 2. return if any remaining balance of before want(wstETH) to user
        uint256 remaining = IERC20(address(WSTETH)).balanceOf(address(this));
        if (remaining > 0) {
            IERC20(address(WSTETH)).safeTransfer(msg.sender, remaining);
        }
    }

    function _ethToStEth(uint256 _amount) internal returns (uint256) {
        STETH.submit{value: _amount}(address(this));
    }

    function _stEthToWstEth(uint256 _amount) internal returns (uint256) {
        uint256 tokenAmt = WSTETH.wrap(_amount);
        return tokenAmt;
    }

    function _wstEthToWant() internal returns (uint256 lpAmount) {
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amount;

        (, lpAmount) = mellowVault.deposit(address(this), amounts, amount * 99 / 100, block.timestamp + 60);
    }
}
