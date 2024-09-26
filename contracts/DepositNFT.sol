// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {Ownable2StepUpgradeable} from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {ERC721EnumerableUpgradeable} from
    "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";

contract DepositNFT is ERC721Upgradeable, ERC721EnumerableUpgradeable, PausableUpgradeable, Ownable2StepUpgradeable {
    uint256 private _nextTokenId;
    string public baseURI;

    address public depositContract;

    struct DepositInfo {
        address depositToken;
        uint256 amount;
        address wrappedToken;
        uint256 wrappedAmount;
    }

    mapping(uint256 tokenId => DepositInfo) public depositInfo;

    event Deposit(uint256 indexed tokenId, address indexed token, uint256 amount);

    error CallerIsNotDepositContract();
    error EOATransferPaused();

    constructor() {
        _disableInitializers();
    }

    function initialize() external initializer {
        __ERC721_init("DepositNFT", "deNFT");
        __Ownable2Step_init();
        __Pausable_init();
        __ERC721Enumerable_init();

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

    function setDepositContract(address depositContract_) external onlyOwner {
        depositContract = depositContract_;
    }

    function safeMint(address to, address token, uint256 amount, address wrappedToken, uint256 wrappedAmount)
        external
    {
        if (msg.sender != depositContract) {
            revert CallerIsNotDepositContract();
        }

        uint256 tokenId = _nextTokenId++;

        _safeMint(to, tokenId);

        depositInfo[tokenId] = DepositInfo(token, amount, wrappedToken, wrappedAmount);

        emit Deposit(tokenId, token, amount);
    }

    /**
     * @notice Get Token Ids of a user
     * @param user user address
     * @return uint256[] token ids
     */
    function getTokenIds(address user) public view returns (uint256[] memory) {
        uint256[] memory userTokens = new uint256[](balanceOf(user));
        for (uint256 i; i < balanceOf(user); i++) {
            userTokens[i] = tokenOfOwnerByIndex(user, i);
        }
        return userTokens;
    }

    function getDepositInfo(uint256 _tokenId) public view returns (address, uint256, address, uint256) {
        DepositInfo memory info = depositInfo[_tokenId];
        return (info.depositToken, info.amount, info.wrappedToken, info.wrappedAmount);
    }

    function getUserNftInfos(address user) public view returns (
        address[] memory depositTokens,
        uint256[] memory amounts,
        address[] memory wrappedTokens,
        uint256[] memory wrappedAmounts
    ) {
        uint256[] memory tokenIds = getTokenIds(user);

        depositTokens = new address[](tokenIds.length);
        amounts = new uint256[](tokenIds.length);
        wrappedTokens = new address[](tokenIds.length);
        wrappedAmounts = new uint256[](tokenIds.length);

        for (uint256 i = 0; i < tokenIds.length; i++) {
            (address depositToken, uint256 amount, address wrappedToken, uint256 wrappedAmount) = getDepositInfo(tokenIds[i]);
            depositTokens[i] = depositToken;
            amounts[i] = amount;
            wrappedTokens[i] = wrappedToken;
            wrappedAmounts[i] = wrappedAmount;
        }  
    }

    function setBaseURI(string memory baseURI_) external onlyOwner {
        baseURI = baseURI_;
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    // The following functions are overrides required by Solidity.

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
    {
        if (paused()) {
            if (from != address(0)) {
                revert EOATransferPaused();
            }
        }

        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(uint256 tokenId) internal override(ERC721Upgradeable) {
        super._burn(tokenId);
    }
}
