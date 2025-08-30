// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AranduCertificates
 * @dev Soulbound ERC721 NFT for student certificates. Non-transferable.
 */
contract AranduCertificates is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;
    mapping(uint256 => string) public certificateType; // e.g., "student" or "teacher"

    /**
     * @dev Constructor that sets the initial owner.
     * @param initialOwner The address that will own the contract.
     */
    constructor(
        address initialOwner
    ) ERC721("Arandu Certificates", "ARC") Ownable(initialOwner) {}

    /**
     * @dev Overrides _update to make tokens soulbound (non-transferable).
     * Only allows minting (from == address(0)).
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721) returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert(
                "AranduCertificates: Certificates are soulbound and cannot be transferred"
            );
        }
        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Overrides supportsInterface.
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Overrides tokenURI to support metadata.
     */
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    /**
     * @dev Mints a new certificate NFT. Only callable by the owner.
     * @param to The address to receive the certificate.
     * @param uri The metadata URI for the certificate.
     * @param certType The type of certificate: "student" or "teacher".
     */
    function safeMint(address to, string memory uri, string memory certType) public onlyOwner {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        certificateType[tokenId] = certType;
    }
}
