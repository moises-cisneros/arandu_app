// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title AranduResources
 * @dev Contract for managing educational resources as NFTs with licenses and royalties.
 * Inherits from ERC1155 for multi-token management, ERC1155URIStorage for metadata,
 * ERC2981 for royalties, and Ownable for admin control.
 */
contract AranduResources is ERC1155, ERC1155URIStorage, ERC2981, Ownable {
    IERC20 public anduToken;
    uint256 private _nextTokenId;
    mapping(uint256 => uint256) public licensePrices;
    mapping(uint256 => address) public creators;

    /**
     * @dev Constructor to set the ANDU token address.
     * @param _anduTokenAddress The address of the ANDU ERC20 token contract.
     */
    constructor(address _anduTokenAddress) ERC1155("") Ownable(msg.sender) {
        anduToken = IERC20(_anduTokenAddress);
    }

    /**
     * @dev Creates a new educational resource with master and license tokens.
     * @param initialLicenseSupply The initial supply of license tokens.
     * @param _uri The metadata URI for the resource.
     * @param royaltyFeeInBps The royalty fee in basis points (e.g., 500 for 5%).
     */
    function createResource(
        uint256 initialLicenseSupply,
        string memory _uri,
        uint96 royaltyFeeInBps
    ) public {
        // Increment _nextTokenId by 2 to reserve IDs for master and license
        _nextTokenId += 2;
        uint256 masterTokenId = _nextTokenId - 2;
        uint256 licenseTokenId = _nextTokenId - 1;

        // Mint 1 master token to the creator
        _mint(msg.sender, masterTokenId, 1, "");

        // Mint initial license supply to the creator
        _mint(msg.sender, licenseTokenId, initialLicenseSupply, "");

        // Set URI for both token IDs
        _setURI(masterTokenId, _uri);
        _setURI(licenseTokenId, _uri);

        // Record the creator
        creators[masterTokenId] = msg.sender;

        // Set default royalty for the creator
        _setDefaultRoyalty(msg.sender, royaltyFeeInBps);
    }

    /**
     * @dev Sets the price for a license token.
     * @param licenseTokenId The ID of the license token.
     * @param price The price in ANDU tokens.
     */
    function setLicensePrice(uint256 licenseTokenId, uint256 price) public {
        uint256 masterTokenId = licenseTokenId - 1;
        require(
            creators[masterTokenId] == msg.sender,
            "AranduResources: Not the creator"
        );
        licensePrices[licenseTokenId] = price;
    }

    /**
     * @dev Allows buying licenses for a resource.
     * @param licenseTokenId The ID of the license token.
     * @param quantity The number of licenses to buy.
     */
    function buyLicenses(uint256 licenseTokenId, uint256 quantity) public {
        require(
            licensePrices[licenseTokenId] > 0,
            "AranduResources: Price not set"
        );
        uint256 masterTokenId = licenseTokenId - 1;
        address creator = creators[masterTokenId];
        require(
            creator != address(0),
            "AranduResources: Invalid license token"
        );

        // Check if creator has enough licenses
        require(
            balanceOf(creator, licenseTokenId) >= quantity,
            "AranduResources: Insufficient licenses"
        );

        uint256 totalCost = licensePrices[licenseTokenId] * quantity;

        // Transfer ANDU tokens from buyer to creator
        require(
            anduToken.transferFrom(msg.sender, creator, totalCost),
            "AranduResources: Token transfer failed"
        );

        // Transfer licenses from creator to buyer
        _safeTransferFrom(creator, msg.sender, licenseTokenId, quantity, "");
    }

    /**
     * @dev Returns royalty information for a token sale.
     * @param _tokenId The token ID.
     * @param _salePrice The sale price.
     * @return receiver The royalty receiver.
     * @return royaltyAmount The royalty amount.
     */
    function royaltyInfo(
        uint256 _tokenId,
        uint256 _salePrice
    ) public view override returns (address receiver, uint256 royaltyAmount) {
        return super.royaltyInfo(_tokenId, _salePrice);
    }

    /**
     * @dev Overrides uri to return the URI for a token ID.
     * @param tokenId The token ID.
     * @return The URI string.
     */
    function uri(
        uint256 tokenId
    ) public view override(ERC1155, ERC1155URIStorage) returns (string memory) {
        return super.uri(tokenId);
    }

    /**
     * @dev Overrides supportsInterface to support ERC1155, ERC2981, and other interfaces.
     * @param interfaceId The interface ID.
     * @return True if supported.
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC1155, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
