// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {Ownable2StepUpgradeable} from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IDepositNFT} from "./interfaces/IDepositNFT.sol";
import {IWstETH} from "./interfaces/IWstETH.sol";
import {ILido} from "./interfaces/ILido.sol";
import {IOGNFT} from "./interfaces/IOGNFT.sol";
import {IMellowVault} from "./interfaces/IMellowVault.sol";

/// @title Staking.sol
/// @author Synstation
/// @notice Main Staking Contract for synstation
/// @dev features:
/// - deposit ETH, stETH, ERC20
/// - mint OGNFT (if value >= 10 ETH only && once per user)
/// - mint DepositNFT for each deposit
/// @dev For Current Version, withdrawal is not avaliable.
contract Staking is Ownable2StepUpgradeable, PausableUpgradeable {
    using SafeERC20 for IERC20;

    mapping(address token => bool accepted) public depositAllowed;

    struct UserInfo {
        address wrappedToken;
        uint256 wrappedAmount;
    }

    mapping(address user => mapping(address depositToken => UserInfo)) public userInfos;

    address public depositNFT;
    address public ogNFT;

    // For ETH deposit, Wrap
    ILido public STETH;
    IWstETH public WSTETH;

    bool public withdrawalEnabled;
    uint256 EMERGENCY_WITHDRAW_TIMESTAMP = 1742660852;

    IMellowVault public mellowVault;

    error DepositNotAllowed();
    error DepositNFTNotSet();
    error ZeroDeposit();
    error InvalidAmount();
    error ValueNotAccepted();
    error EmergencyTimestampNotReached();
    error WithdrawalNotEnabled();

    event Staked(
        address indexed user, address indexed token, uint256 amount, address wrappedToken, uint256 wrappedAmount
    );

    constructor() {
        _disableInitializers();
    }

    function initialize() external initializer {
        __Ownable2Step_init();
        __Pausable_init();
        _pause();
    }

    /**
     * @notice Pause deposits to the bridge (admin only)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause deposits to the bridge (admin only)
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    function setMellowVault(address _mellowVault) external onlyOwner {
        mellowVault = IMellowVault(_mellowVault);

        IERC20(address(WSTETH)).safeApprove(_mellowVault, type(uint256).max);
    }

    /**
     * @notice Set the deposit NFT contract address
     * @param _depositNFT the address of the deposit NFT contract
     */
    function setDepositNFT(address _depositNFT) external onlyOwner {
        depositNFT = _depositNFT;
    }

    /**
     * @notice Set the OG NFT contract address
     * @param _ogNFT the address of the OG NFT contract
     */
    function setOGNFT(address _ogNFT) external onlyOwner {
        ogNFT = _ogNFT;
    }

    /**
     * @notice Set the deposit allowed status for a token
     * @param _token the address of the token
     * @param _allowed the allowed status
     */
    function setDepositAllowed(address _token, bool _allowed) external onlyOwner {
        depositAllowed[_token] = _allowed;
    }

    function setEmergencyWithdrawTimestamp(uint256 _timestamp) external onlyOwner {
        EMERGENCY_WITHDRAW_TIMESTAMP = _timestamp;
    }

    /**
     * @notice Set the deposit allowed status for lido related tokens
     * @param _stETH the addresses of the tokens
     * @param _wstETH the allowed status
     * @param _allowDeposit the allowed status
     */
    function setLido(address _stETH, address _wstETH, bool _allowDeposit) external onlyOwner {
        STETH = ILido(_stETH);
        WSTETH = IWstETH(_wstETH);

        STETH.approve(address(WSTETH), type(uint256).max);
        WSTETH.approve(address(STETH), type(uint256).max);

        if (_allowDeposit) {
            depositAllowed[address(STETH)] = true;
            depositAllowed[address(WSTETH)] = true;
            depositAllowed[address(0)] = true; // ETH
        }
    }

    /**
     * @notice Set the withdrawal enabled status
     * @param _enabled the enabled status
     */
    function setWithdrawalEnabled(bool _enabled) external onlyOwner {
        withdrawalEnabled = _enabled;
    }

    /*
     * @notice Deposit token to the contract
     * @param token token address
     * @param amount token amount
     * @dev depositETH -> stETH -> wstETH
     * @dev depositstETH -> wstETH
     * @dev depositERC20 -> ERC20
     */
    function deposit(address token, uint256 amount) external payable whenNotPaused {
        if (!depositAllowed[token]) {
            revert DepositNotAllowed();
        }
        if (depositNFT == address(0)) {
            revert DepositNFTNotSet();
        }

        uint256 tokenAmt;
        if (token == address(0)) {
            _depositETH(amount);
            // stake ETH to stETH after deposit
            STETH.submit{value: amount}(msg.sender);
            // wrap stETH to wstETH after deposit
            tokenAmt = WSTETH.wrap(amount);

            // mint OGNFT if amount >= 10 ETH only once per user
            if (IOGNFT(ogNFT).ogMintAvailable(msg.sender, amount)) {
                IOGNFT(ogNFT).safeMint(msg.sender);
            }

            IDepositNFT(depositNFT).safeMint(msg.sender, address(0), msg.value, address(WSTETH), tokenAmt);

            UserInfo storage user = userInfos[msg.sender][address(0)];

            user.wrappedAmount += tokenAmt;
            user.wrappedToken = address(WSTETH);

            emit Staked(msg.sender, address(0), msg.value, address(WSTETH), tokenAmt);
        } else if (token == address(STETH)) {
            _depositERC20(token, amount);
            // wrap stETH to wstETH after deposit
            tokenAmt = WSTETH.wrap(amount);

            IDepositNFT(depositNFT).safeMint(msg.sender, address(STETH), amount, address(WSTETH), tokenAmt);

            UserInfo storage user = userInfos[msg.sender][address(STETH)];

            user.wrappedAmount += tokenAmt;
            user.wrappedToken = address(WSTETH);

            emit Staked(msg.sender, address(STETH), amount, address(WSTETH), tokenAmt);
        } else {
            _depositERC20(token, amount);

            tokenAmt = amount;

            IDepositNFT(depositNFT).safeMint(msg.sender, token, tokenAmt, token, tokenAmt);

            UserInfo storage user = userInfos[msg.sender][token];

            user.wrappedAmount += tokenAmt;
            user.wrappedToken = token;

            emit Staked(msg.sender, token, amount, token, tokenAmt);
        }

        // if wrapped Token is wstETH, deposit to mellow
    }

    function _depositETH(uint256 amount) internal {
        if (msg.value == 0) {
            revert ZeroDeposit();
        }
        if (msg.value != amount) {
            revert InvalidAmount();
        }
    }

    function _depositERC20(address token, uint256 amount) internal {
        if (amount == 0) {
            revert ZeroDeposit();
        }
        if (msg.value != 0) {
            revert ValueNotAccepted();
        }
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
    }

    /**
     * @notice Emergency withdraw all tokens
     * @param token token address
     * @dev only available after EMERGENCY_WITHDRAW_TIMESTAMP
     */
    function emergencyWithdraw(address token) external {
        if (EMERGENCY_WITHDRAW_TIMESTAMP > block.timestamp) {
            revert EmergencyTimestampNotReached();
        }

        UserInfo storage user = userInfos[msg.sender][token];
        if (token == address(0) || token == address(STETH)) {
            uint256 stAmount = WSTETH.unwrap(user.wrappedAmount);

            user.wrappedAmount = 0;
            IERC20(address(STETH)).safeTransfer(msg.sender, stAmount);
        } else {
            uint256 returnAmount = user.wrappedAmount;
            user.wrappedAmount = 0;
            IERC20(token).safeTransfer(msg.sender, returnAmount);
        }
    }

    /**
     * @notice Withdraw all tokens
     * @param token token address
     * @param amount token amount
     * @dev only available if withdrawalEnabled is true
     */
    function withdraw(address token, uint256 amount) external {
        if (!withdrawalEnabled) {
            revert WithdrawalNotEnabled();
        }

        _withdraw(token, amount);
    }

    function _withdraw(address token, uint256 amount) internal {
        UserInfo storage user = userInfos[msg.sender][token];
        if (token == address(0) || token == address(STETH)) {
            uint256 wstAmount = WSTETH.getWstETHByStETH(amount);

            user.wrappedAmount -= wstAmount;

            uint256 stAmount = WSTETH.unwrap(wstAmount);

            STETH.transfer(msg.sender, stAmount);
        } else {
            user.wrappedAmount -= amount;

            IERC20(token).safeTransfer(msg.sender, amount);
        }
    }

    function _depositToMellow(uint256 amount) internal {
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amount;

        // TODO : min, deadline, acutal amount handle, wrapped amount handle
        mellowVault.deposit(address(this), amounts, amount * 99 / 100, block.timestamp + 60);
    }

    /// VIEW
    function getUserInfo(address user, address[] memory tokens)
        external
        view
        returns (
            address[] memory principalTokens,
            uint256[] memory depositedAmounts,
            address[] memory wrappedTokens,
            uint256[] memory wrappedAmounts,
            uint256[] memory walletBalances
        )
    {
        principalTokens = new address[](tokens.length);
        wrappedTokens = new address[](tokens.length);
        wrappedAmounts = new uint256[](tokens.length);
        walletBalances = new uint256[](tokens.length);
        depositedAmounts = new uint256[](tokens.length);

        for (uint256 i = 0; i < tokens.length; i++) {
            principalTokens[i] = tokens[i];
            if (tokens[i] == address(0)) {
                walletBalances[i] = address(user).balance;
            } else {
                walletBalances[i] = IERC20(tokens[i]).balanceOf(user);
            }
            wrappedTokens[i] = userInfos[user][tokens[i]].wrappedToken;
            wrappedAmounts[i] = userInfos[user][tokens[i]].wrappedAmount;

            if (tokens[i] != wrappedTokens[i]) {
                depositedAmounts[i] = WSTETH.getStETHByWstETH(wrappedAmounts[i]);
            } else {
                depositedAmounts[i] = wrappedAmounts[i];
            }
        }
    }

    function getExchangeRateFromWstToSt() external view returns (uint256) {
        return WSTETH.getStETHByWstETH(1 ether);
    }
}
