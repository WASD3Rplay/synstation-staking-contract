// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SynstationPreStaking is AccessControlUpgradeable {
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant LISTING_ROLE = keccak256("LISTING_ROLE");

    struct UserInfo {
        uint256 amount;
        uint256 lastDepositTimestamp;
    }

    struct PoolInfo {
        IERC20 want;
        uint256 totalDeposited;
        uint256 depositCap;
        bool paused;
    }

    PoolInfo[] public poolInfo;
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;

    event Deposit(
        address indexed user,
        uint256 indexed pid,
        address token,
        uint256 amount,
        address indexed to
    );
    event Withdraw(
        address indexed user,
        uint256 indexed pid,
        address token,
        uint256 amount,
        address indexed to
    );
    event AddNewPool(
        uint256 indexed pid,
        address indexed token,
        uint256 depositCap
    );
    event SetDepositCap(uint256 indexed pid, uint256 depositCap);
    event SetPause(uint256 indexed pid, bool paused);

    constructor() {}

    function initialize(address _defaultAdmin) external initializer {
        __AccessControl_init();

        _setupRole(DEFAULT_ADMIN_ROLE, _defaultAdmin);

        _setupRole(ADMIN_ROLE, _defaultAdmin);
        _setupRole(LISTING_ROLE, _defaultAdmin);
    }

    //VIEW FUNCTIONS
    function poolLength() public view returns (uint256) {
        return poolInfo.length;
    }

    /// @notice Deposit LP tokens to MonoMaster for reward allocation.
    /// @param pid The index of the pool. See `poolInfo`.
    /// @param amount LP token amount to deposit.
    /// @param to The receiver of `amount` deposit benefit.
    function deposit(uint256 pid, uint256 amount, address to) external {
        PoolInfo storage pool = poolInfo[pid];

        require(!pool.paused, "!paused");

        if (amount > 0) {
            UserInfo storage user = userInfo[pid][to];

            pool.want.safeTransferFrom(
                address(msg.sender),
                address(this),
                amount
            );

            user.amount = user.amount + amount;
            user.lastDepositTimestamp = block.timestamp;

            pool.totalDeposited = pool.totalDeposited + amount;

            if (pool.depositCap > 0) {
                require(pool.totalDeposited <= pool.depositCap, "!deposit-cap");
            }

            emit Deposit(msg.sender, pid, address(pool.want), amount, to);
        }
    }

    /// @notice Withdraw LP tokens from MonoMaster.
    /// @param pid The index of the pool. See `poolInfo`.
    /// @param desiredAmount amount of shares to withdraw.
    /// @param to Receiver of the LP tokens.
    function withdraw(uint256 pid, uint256 desiredAmount, address to) external {
        PoolInfo storage pool = poolInfo[pid];
        UserInfo storage user = userInfo[pid][msg.sender];

        if (desiredAmount > user.amount) {
            desiredAmount = user.amount;
        }

        if (desiredAmount > 0) {
            user.amount = user.amount - desiredAmount;
            pool.totalDeposited = pool.totalDeposited - desiredAmount;

            pool.want.safeTransfer(to, desiredAmount);

            emit Withdraw(
                msg.sender,
                pid,
                address(pool.want),
                desiredAmount,
                to
            );
        }
    }

    function add(
        IERC20 _want,
        uint256 _depositCap
    ) external onlyRole(LISTING_ROLE) {
        poolInfo.push(
            PoolInfo({
                want: _want,
                totalDeposited: 0,
                depositCap: _depositCap,
                paused: false
            })
        );

        emit AddNewPool(poolInfo.length - 1, address(_want), _depositCap);
    }

    function setDepositCap(
        uint256 _pid,
        uint256 _depositCap
    ) external onlyRole(LISTING_ROLE) {
        poolInfo[_pid].depositCap = _depositCap;

        emit SetDepositCap(_pid, _depositCap);
    }

    function setPause(
        uint256 _pid,
        bool _paused
    ) external onlyRole(ADMIN_ROLE) {
        poolInfo[_pid].paused = _paused;

        emit SetPause(_pid, _paused);
    }

    function rescueFunds(
        IERC20 token,
        uint256 amount
    ) external onlyRole(ADMIN_ROLE) {
        token.safeTransfer(msg.sender, amount);
    }

    function rescueETH(uint256 amount) external onlyRole(ADMIN_ROLE) {
        (bool suc, ) = address(msg.sender).call{value: amount}("");
        require(suc, "!eth-rescue");
    }

    // Roles
    function grantListingRole(address _account) external {
        grantRole(LISTING_ROLE, _account);
    }

    function revokeListingRole(address _account) external {
        revokeRole(LISTING_ROLE, _account);
    }

    function grantAdminRole(address _account) external {
        grantRole(ADMIN_ROLE, _account);
    }

    function revokeAdminRole(address _account) external {
        revokeRole(ADMIN_ROLE, _account);
    }
}
