// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AranduBadges
 * @dev ERC721 NFT for gamification badges. Soulbound (non-transferable).
 */
contract AranduBadges is ERC721, Ownable {
    uint256 private _nextTokenId;
    mapping(uint256 => string) public badgeName; // e.g., "Streak Champion"

    /**
     * @dev Constructor that sets the initial owner.
     * @param initialOwner The address that will own the contract.
     */
    constructor(
        address initialOwner
    ) ERC721("Arandu Badges", "ARB") Ownable(initialOwner) {}

    /**
     * @dev Overrides _update to make tokens soulbound (non-transferable).
     * Only allows minting (from == address(0)).
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert("AranduBadges: Badges are soulbound and cannot be transferred");
        }
        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Mints a new badge NFT. Only callable by the owner.
     * @param to The address to receive the badge.
     * @param name The name of the badge.
     */
    function safeMint(address to, string memory name) public onlyOwner {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        badgeName[tokenId] = name;
    }
}
