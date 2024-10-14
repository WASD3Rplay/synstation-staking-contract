// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import {SynstationPreStaking} from "./SynstationPreStaking.sol";

import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
abstract contract SynstationDepositWrapper {
    using SafeERC20 for IERC20;

    address public preStaking;
    uint256 public pid;
    IERC20 public want;

    constructor(address _preStaking, uint256 _pid, IERC20 _want) {
        preStaking = _preStaking;

        pid = _pid;

        want = _want;

        IERC20(address(want)).safeApprove(_preStaking, type(uint256).max);
    }

    function deposit(
        address _token,
        uint256 _amount
    ) external payable virtual returns (uint256) {
        _handleWrapProcess(_token, _amount);

        return _handleDeposit();
    }

    function _handleWrapProcess(
        address _token,
        uint256 _amount
    ) internal virtual;

    function _handleDeposit() internal returns (uint256) {
        uint256 lpBal = want.balanceOf(address(this));

        SynstationPreStaking(preStaking).deposit(pid, lpBal, msg.sender);

        return lpBal;
    }

    function previewDeposit(
        address _token,
        uint256 _amount
    ) external view virtual returns (uint256);
}
