// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {Ownable2StepUpgradeable} from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {ERC721EnumerableUpgradeable} from
    "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";

/// @title First 100 stakers staking more than 10 ETH will earn additional special OG NFT
/// @author Noah
/// @dev Only 100 stakers can earn this NFT
contract OGNFT is ERC721Upgradeable, ERC721EnumerableUpgradeable, PausableUpgradeable, Ownable2StepUpgradeable {
    uint256 private _nextTokenId;
    string public baseURI;

    address public depositContract;

    mapping(address => bool) public isMinted;

    uint256 public maxMint;
    uint256 public minimumCommitment;

    error CallerIsNotDepositContract();

    constructor() {
        _disableInitializers();
    }

    function initialize() external initializer {
        __ERC721_init("ogNFT", "ogNFT");
        __Ownable2Step_init();
        __Pausable_init();
        __ERC721Enumerable_init();

        _pause();

        minimumCommitment = 10 ether;
        maxMint = 100;
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

    function safeMint(address to) external {
        if (msg.sender != depositContract) {
            revert CallerIsNotDepositContract();
        }

        uint256 tokenId = _nextTokenId++;
        isMinted[to] = true;
        _safeMint(to, tokenId);
    }

    function setBaseURI(string memory baseURI_) external onlyOwner {
        baseURI = baseURI_;
    }

    function setMinimumCommitment(uint256 minimumCommitment_) external onlyOwner {
        minimumCommitment = minimumCommitment_;
    }

    function setMaxMint(uint256 maxMint_) external onlyOwner {
        maxMint = maxMint_;
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function mintAvailable() external view returns (uint256) {
        return maxMint - _nextTokenId;
    }

    function ogMintAvailable(address user, uint256 commitment) external view returns (bool) {
        if (commitment < minimumCommitment) {
            return false;
        }

        return maxMint - _nextTokenId > 0 && !isMinted[user];
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
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(uint256 tokenId) internal override(ERC721Upgradeable) {
        super._burn(tokenId);
    }
}
